package com.tensignal.backend.service;

import com.tensignal.backend.dto.PaymentWebhookResponse;
import com.tensignal.backend.entity.PaymentProviderEvent;
import com.tensignal.backend.entity.PaymentTransaction;
import com.tensignal.backend.exception.InvalidPaymentEventException;
import com.tensignal.backend.payment.*;
import com.tensignal.backend.repository.PaymentProviderEventRepository;
import com.tensignal.backend.repository.PaymentTransactionRepository;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import com.tensignal.backend.observability.TransactionalObservability;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentEventProcessor {
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentProviderEventRepository eventRepository;
    private final PaymentProductCatalog productCatalog;
    private final PaymentEntitlementService entitlementService;
    private final AuditLogService auditLogService;
    private final ApplicationMetrics metrics;
    private final TransactionalObservability transactionalObservability;

    @Transactional
    public PaymentWebhookResponse process(String provider, VerifiedPaymentEvent event, String payloadDigest) {
        if (event.isIgnored() || event.type() == null) {
            transactionalObservability.afterCommit(() -> {
                metrics.paymentWebhook("IGNORED", "accepted");
                auditLogService.record(AuditEvent.PAYMENT_EVENT_ACCEPTED, "ignored", Map.of(
                    "provider", provider, "eventId", event.eventId() != null ? event.eventId() : "unknown"));
            });
            return new PaymentWebhookResponse(true, false, null, null);
        }

        PaymentTransaction transaction = transactionRepository.findByIdForUpdate(event.internalTransactionId())
            .orElseThrow(() -> new InvalidPaymentEventException("Unknown payment transaction reference."));

        if (eventRepository.existsByProviderAndProviderEventId(provider, event.eventId())) {
            transactionalObservability.afterCommit(() -> {
                metrics.paymentWebhook(event.type().name(), "duplicate");
                auditLogService.record(AuditEvent.DUPLICATE_WEBHOOK_IGNORED, "ignored", Map.of(
                    "provider", provider, "eventType", event.type().name()));
            });
            return new PaymentWebhookResponse(true, true, transaction.getId(), transaction.getStatus());
        }

        validateBinding(provider, transaction, event);
        PaymentEventOutcome outcome;
        if (transaction.getLastProviderEventAt() != null
            && event.occurredAt().isBefore(transaction.getLastProviderEventAt())) {
            outcome = PaymentEventOutcome.IGNORED_STALE;
        } else if (isFinalAgainst(transaction.getStatus(), event.type())) {
            outcome = PaymentEventOutcome.IGNORED_FINAL_STATE;
        } else {
            applyEvent(transaction, event);
            transaction.setLastProviderEventAt(event.occurredAt());
            outcome = PaymentEventOutcome.PROCESSED;
        }

        if (transaction.getProviderTransactionId() == null) {
            transaction.setProviderTransactionId(event.providerTransactionId());
        }
        transactionRepository.saveAndFlush(transaction);
        eventRepository.saveAndFlush(PaymentProviderEvent.builder()
            .provider(provider)
            .providerEventId(event.eventId())
            .paymentTransactionId(transaction.getId())
            .eventType(event.type())
            .outcome(outcome)
            .payloadDigest(payloadDigest)
            .providerOccurredAt(event.occurredAt())
            .build());
        String metricOutcome = outcome == PaymentEventOutcome.PROCESSED ? "accepted" : "ignored";
        transactionalObservability.afterCommit(() -> {
            metrics.paymentWebhook(event.type().name(), metricOutcome);
            auditLogService.record(AuditEvent.PAYMENT_EVENT_ACCEPTED, metricOutcome, Map.of(
                "provider", provider, "eventType", event.type().name(), "outcome", outcome.name()));
            if (event.type() == PaymentEventType.PAYMENT_REFUNDED
                || event.type() == PaymentEventType.PAYMENT_PARTIALLY_REFUNDED) {
                auditLogService.record(AuditEvent.PAYMENT_REFUND, metricOutcome,
                    Map.of("provider", provider, "eventType", event.type().name()));
            } else if (event.type() == PaymentEventType.PAYMENT_CHARGEBACK) {
                auditLogService.record(AuditEvent.PAYMENT_CHARGEBACK, metricOutcome,
                    Map.of("provider", provider, "eventType", event.type().name()));
            }
        });
        return new PaymentWebhookResponse(true, false, transaction.getId(), transaction.getStatus());
    }

    private void validateBinding(String provider, PaymentTransaction transaction, VerifiedPaymentEvent event) {
        PaymentProduct product = productCatalog.findProduct(event.productCode())
            .orElseThrow(() -> new InvalidPaymentEventException("Payment product is not recognized by the catalog."));
        long expectedCatalogAmount = product.amountMinor();

        if (!transaction.getProvider().equals(provider)
            || !transaction.getOwnerAccountId().equals(event.ownerAccountId())
            || !transaction.getProductCode().equals(event.productCode())
            || !transaction.getProviderCheckoutId().equals(event.providerCheckoutId())
            || transaction.getAmountMinor() != expectedCatalogAmount
            || !transaction.getCurrency().equalsIgnoreCase(event.currency())
            || transaction.getEntitlementType() != product.entitlementType()
            || transaction.getEntitlementQuantity() != product.capacityAmount()) {
            throw new InvalidPaymentEventException("Payment event metadata does not match the server checkout record.");
        }
        boolean partial = event.type() == PaymentEventType.PAYMENT_PARTIALLY_REFUNDED;
        if ((partial && (event.amountMinor() <= 0 || event.amountMinor() > transaction.getAmountMinor()))
            || (!partial && event.amountMinor() != transaction.getAmountMinor())) {
            throw new InvalidPaymentEventException("Payment event amount does not match the server checkout record.");
        }
        transactionRepository.findByProviderAndProviderTransactionId(provider, event.providerTransactionId())
            .filter(existing -> !existing.getId().equals(transaction.getId()))
            .ifPresent(existing -> {
                throw new InvalidPaymentEventException("Provider transaction reference is already bound to another checkout.");
            });
        if (transaction.getProviderTransactionId() != null
            && !transaction.getProviderTransactionId().equals(event.providerTransactionId())) {
            throw new InvalidPaymentEventException("Payment transaction reference changed unexpectedly.");
        }
    }

    private void applyEvent(PaymentTransaction transaction, VerifiedPaymentEvent event) {
        switch (event.type()) {
            case PAYMENT_PAID -> {
                transaction.setStatus(PaymentStatus.PAID);
                entitlementService.grant(transaction, event.occurredAt());
            }
            case PAYMENT_FAILED -> transaction.setStatus(PaymentStatus.FAILED);
            case PAYMENT_CANCELLED -> transaction.setStatus(PaymentStatus.CANCELLED);
            case CHECKOUT_EXPIRED -> transaction.setStatus(PaymentStatus.EXPIRED);
            case PAYMENT_PARTIALLY_REFUNDED -> {
                transaction.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
                transaction.setRefundedAt(event.occurredAt());
                transaction.setReversalStatus(EntitlementReversalStatus.MANUAL_REVIEW_REQUIRED);
            }
            case PAYMENT_REFUNDED -> {
                transaction.setStatus(PaymentStatus.REFUNDED);
                transaction.setRefundedAt(event.occurredAt());
                entitlementService.handleFullReversal(transaction);
            }
            case PAYMENT_CHARGEBACK -> {
                transaction.setStatus(PaymentStatus.CHARGEBACK);
                transaction.setChargebackAt(event.occurredAt());
                entitlementService.handleFullReversal(transaction);
            }
        }
    }

    private boolean isFinalAgainst(PaymentStatus current, PaymentEventType incoming) {
        if (current == PaymentStatus.CHARGEBACK) {
            return true;
        }
        if (current == PaymentStatus.REFUNDED) {
            return incoming != PaymentEventType.PAYMENT_CHARGEBACK;
        }
        if (current == PaymentStatus.PAID) {
            return incoming == PaymentEventType.PAYMENT_PAID
                || incoming == PaymentEventType.PAYMENT_FAILED
                || incoming == PaymentEventType.PAYMENT_CANCELLED
                || incoming == PaymentEventType.CHECKOUT_EXPIRED;
        }
        return false;
    }
}
