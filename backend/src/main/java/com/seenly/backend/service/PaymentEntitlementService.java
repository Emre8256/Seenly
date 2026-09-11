package com.seenly.backend.service;

import com.seenly.backend.entity.PaymentTransaction;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import com.seenly.backend.exception.InvalidPaymentEventException;
import com.seenly.backend.payment.EntitlementReversalStatus;
import com.seenly.backend.payment.EntitlementType;
import com.seenly.backend.payment.PaymentStatus;
import com.seenly.backend.repository.PaymentTransactionRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import com.seenly.backend.observability.ApplicationMetrics;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.email.EmailNotificationService;
import com.seenly.backend.email.NotificationType;
import com.seenly.backend.observability.AuditLogService;
import com.seenly.backend.observability.TransactionalObservability;
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
    private final SeenlyRepository seenlyRepository;
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
            var seenlies = seenlyRepository.findByUser(user);
            seenlies.forEach(seenly -> seenly.setCapped(false));
            seenlyRepository.saveAll(seenlies);
        } else {
            int current = Objects.requireNonNullElse(user.getPurchasedExtraCapacity(), 0);
            try {
                user.setPurchasedExtraCapacity(Math.addExact(current, transaction.getEntitlementQuantity()));
            } catch (ArithmeticException ex) {
                throw new InvalidPaymentEventException("Capacity entitlement exceeds the supported account limit.");
            }
            int responses = seenlyRepository.findByUser(user).stream().mapToInt(Seenly::getResponseCount).sum();
            transaction.setResponseCountAtGrant(responses);
            var seenlies = seenlyRepository.findByUser(user);
            seenlies.forEach(seenly -> {
                int allowed = user.getBaseFormCapacity() + user.getPurchasedExtraCapacity();
                if (seenly.getResponseCount() < allowed) {
                    seenly.setCapped(false);
                }
            });
            seenlyRepository.saveAll(seenlies);
        }
        transaction.setEntitlementGrantedAt(grantedAt);
        userRepository.save(user);

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            if (transaction.getEntitlementType() == EntitlementType.PLUS) {
                emailNotificationService.enqueue(
                    NotificationType.PLUS_WELCOME,
                    user.getEmail(),
                    user.getId(),
                    "tr",
                    Map.of("dashboardUrl", "https://seenly.app/dashboard"),
                    "plus-welcome:" + transaction.getId(),
                    grantedAt,
                    null
                );
            }

            emailNotificationService.enqueue(
                NotificationType.PURCHASE_RECEIPT,
                user.getEmail(),
                user.getId(),
                "tr",
                Map.of(
                    "product", transaction.getProductCode() != null ? transaction.getProductCode() : "Seenly Plus",
                    "amount", String.format(java.util.Locale.ROOT, "%.2f", transaction.getAmountMinor() / 100.0),
                    "currency", transaction.getCurrency() != null ? transaction.getCurrency() : "TRY",
                    "reference", transaction.getId().toString().substring(0, 8),
                    "timestamp", grantedAt.toString(),
                    "dashboardUrl", "https://seenly.app/dashboard"
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
        if (user.getPremiumPaymentTransactionId() == null) {
            // A legacy/manual entitlement has no payment source and must not be removed automatically.
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
        var seenlies = seenlyRepository.findByUser(user);
        seenlies.forEach(seenly -> {
            int allowed = user.getBaseFormCapacity() + Objects.requireNonNullElse(user.getPurchasedExtraCapacity(), 0);
            if (seenly.getResponseCount() >= allowed) {
                seenly.setCapped(true);
            }
        });
        seenlyRepository.saveAll(seenlies);
        transaction.setReversalStatus(EntitlementReversalStatus.REVERSED);
    }
}
