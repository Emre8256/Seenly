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
import com.seenly.backend.observability.AuditLogService;
import com.seenly.backend.observability.TransactionalObservability;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    void grant(PaymentTransaction transaction, Instant grantedAt) {
        if (transaction.getEntitlementGrantedAt() != null) {
            return;
        }
        User user = userRepository.findByIdForUpdate(transaction.getOwnerAccountId())
            .orElseThrow(() -> new InvalidPaymentEventException("Payment owner account no longer exists."));

        if (transaction.getEntitlementType() == EntitlementType.PLUS) {
            user.setIsPremium(true);
            user.setPremiumPaymentTransactionId(transaction.getId());
            seenlyRepository.findByUser(user).forEach(seenly -> seenly.setCapped(false));
        } else {
            int current = Objects.requireNonNullElse(user.getPurchasedExtraCapacity(), 0);
            try {
                user.setPurchasedExtraCapacity(Math.addExact(current, transaction.getEntitlementQuantity()));
            } catch (ArithmeticException ex) {
                throw new InvalidPaymentEventException("Capacity entitlement exceeds the supported account limit.");
            }
            int responses = seenlyRepository.findByUser(user).stream().mapToInt(Seenly::getResponseCount).sum();
            transaction.setResponseCountAtGrant(responses);
            seenlyRepository.findByUser(user).forEach(seenly -> {
                int allowed = user.getBaseFormCapacity() + user.getPurchasedExtraCapacity();
                if (seenly.getResponseCount() < allowed) {
                    seenly.setCapped(false);
                }
            });
        }
        transaction.setEntitlementGrantedAt(grantedAt);
        userRepository.save(user);
        transactionalObservability.afterCommit(() -> {
            metrics.entitlement(transaction.getEntitlementType().name(), "success");
            auditLogService.record(AuditEvent.ENTITLEMENT_GRANTED, "success", Map.of(
                "provider", transaction.getProvider(),
                "product", transaction.getProductCode(),
                "entitlement", transaction.getEntitlementType().name()));
        });
    }

    void handleFullReversal(PaymentTransaction transaction) {
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
        transaction.setReversalStatus(EntitlementReversalStatus.REVERSED);
    }
}
