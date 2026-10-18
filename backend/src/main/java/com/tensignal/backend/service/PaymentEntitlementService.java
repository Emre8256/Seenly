package com.tensignal.backend.service;

import com.tensignal.backend.entity.PaymentTransaction;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.exception.InvalidPaymentEventException;
import com.tensignal.backend.payment.EntitlementReversalStatus;
import com.tensignal.backend.payment.EntitlementType;
import com.tensignal.backend.payment.PaymentStatus;
import com.tensignal.backend.repository.PaymentTransactionRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.email.EmailNotificationService;
import com.tensignal.backend.email.NotificationType;
import com.tensignal.backend.observability.AuditLogService;
import com.tensignal.backend.observability.TransactionalObservability;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentEntitlementService {
    private final UserRepository userRepository;
    private final TenSignalRepository tenSignalRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final AuditLogService auditLogService;
    private final ApplicationMetrics metrics;
    private final TransactionalObservability transactionalObservability;
    private final EmailNotificationService emailNotificationService;

    @Transactional
    public void grant(PaymentTransaction transaction, Instant grantedAt) {
        if (transaction.getEntitlementGrantedAt() != null) {
            return;
        }
        User user = userRepository.findByIdForUpdate(transaction.getOwnerAccountId())
            .orElseThrow(() -> new InvalidPaymentEventException("Payment owner account no longer exists."));

        if (transaction.getEntitlementType() == EntitlementType.PLUS) {
            user.setIsPremium(true);
            user.setPremiumPaymentTransactionId(transaction.getId());
            var tenSignals = tenSignalRepository.findByUser(user);
            tenSignals.forEach(tenSignal -> tenSignal.setCapped(false));
            tenSignalRepository.saveAll(tenSignals);
        } else {
            int current = Objects.requireNonNullElse(user.getPurchasedExtraCapacity(), 0);
            try {
                user.setPurchasedExtraCapacity(Math.addExact(current, transaction.getEntitlementQuantity()));
            } catch (ArithmeticException ex) {
                throw new InvalidPaymentEventException("Capacity entitlement exceeds the supported account limit.");
            }
            int responses = tenSignalRepository.findByUser(user).stream().mapToInt(TenSignal::getResponseCount).sum();
            transaction.setResponseCountAtGrant(responses);
            var tenSignals = tenSignalRepository.findByUser(user);
            tenSignals.forEach(tenSignal -> {
                int allowed = user.getBaseFormCapacity() + user.getPurchasedExtraCapacity();
                if (tenSignal.getResponseCount() < allowed) {
                    tenSignal.setCapped(false);
                }
            });
            tenSignalRepository.saveAll(tenSignals);
        }
        transaction.setEntitlementGrantedAt(grantedAt);
        userRepository.save(user);

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            String paymentLocale = user.getPreferredLocale();
            if (paymentLocale == null) {
                var userProfiles = tenSignalRepository.findByUser(user);
                if (!userProfiles.isEmpty()) {
                    paymentLocale = userProfiles.get(0).getPreferredLocale();
                }
            }
            if (paymentLocale == null || (!paymentLocale.equalsIgnoreCase("tr") && !paymentLocale.equalsIgnoreCase("en"))) {
                paymentLocale = "en";
            } else {
                paymentLocale = paymentLocale.trim().toLowerCase(java.util.Locale.ROOT);
            }

            if (transaction.getEntitlementType() == EntitlementType.PLUS) {
                emailNotificationService.enqueue(
                    NotificationType.PLUS_WELCOME,
                    user.getEmail(),
                    user.getId(),
                    paymentLocale,
                    Map.of("dashboardUrl", "https://10signal.me"),
                    "plus-welcome:" + transaction.getId(),
                    grantedAt,
                    null
                );
            }

            emailNotificationService.enqueue(
                NotificationType.PURCHASE_RECEIPT,
                user.getEmail(),
                user.getId(),
                paymentLocale,
                Map.of(
                    "product", transaction.getProductCode() != null ? transaction.getProductCode() : "TenSignal Plus",
                    "amount", String.format(java.util.Locale.ROOT, "%.2f", transaction.getAmountMinor() / 100.0),
                    "currency", transaction.getCurrency() != null ? transaction.getCurrency() : "TRY",
                    "reference", transaction.getId().toString().substring(0, 8),
                    "timestamp", grantedAt.toString(),
                    "dashboardUrl", "https://10signal.me"
                ),
                "purchase-receipt:" + transaction.getId(),
                grantedAt,
                null
            );
        }

        transactionalObservability.afterCommit(() -> {
            metrics.entitlement(transaction.getEntitlementType().name(), "success");
            auditLogService.record(AuditEvent.ENTITLEMENT_GRANTED, "success", Map.of(
                "provider", transaction.getProvider(),
                "product", transaction.getProductCode(),
                "entitlement", transaction.getEntitlementType().name()));
        });
    }

    @Transactional
    public void handleFullReversal(PaymentTransaction transaction) {
        if (transaction.getEntitlementGrantedAt() == null) {
            transaction.setReversalStatus(EntitlementReversalStatus.NONE);
            return;
        }
        User user = userRepository.findByIdForUpdate(transaction.getOwnerAccountId()).orElse(null);
        if (user == null) {
            transaction.setReversalStatus(EntitlementReversalStatus.MANUAL_REVIEW_REQUIRED);
            return;
        }
        if (transaction.getEntitlementType() == EntitlementType.RESPONSE_CAPACITY) {
            // Consumption allocation and legal refund rules are not inferred here.
            transaction.setReversalStatus(EntitlementReversalStatus.MANUAL_REVIEW_REQUIRED);
            return;
        }
        PaymentTransaction replacement = paymentTransactionRepository
            .findByOwnerAccountIdAndEntitlementTypeAndStatusAndIdNotOrderByCreatedAtDesc(
                user.getId(), EntitlementType.PLUS, PaymentStatus.PAID, transaction.getId())
            .stream().findFirst().orElse(null);
        if (replacement != null) {
            user.setIsPremium(true);
            user.setPremiumPaymentTransactionId(replacement.getId());
            userRepository.save(user);
            transaction.setReversalStatus(EntitlementReversalStatus.REVERSED);
            return;
        }
        user.setIsPremium(false);
        user.setPremiumPaymentTransactionId(null);
        userRepository.save(user);
        var tenSignals = tenSignalRepository.findByUser(user);
        tenSignals.forEach(tenSignal -> {
            int allowed = user.getBaseFormCapacity() + Objects.requireNonNullElse(user.getPurchasedExtraCapacity(), 0);
            if (tenSignal.getResponseCount() >= allowed) {
                tenSignal.setCapped(true);
            }
        });
        tenSignalRepository.saveAll(tenSignals);
        transaction.setReversalStatus(EntitlementReversalStatus.REVERSED);
    }
}
