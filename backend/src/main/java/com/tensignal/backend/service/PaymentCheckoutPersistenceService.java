package com.tensignal.backend.service;

import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.entity.PaymentTransaction;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.exception.InvalidPaymentEventException;
import com.tensignal.backend.payment.PaymentProduct;
import com.tensignal.backend.payment.PaymentStatus;
import com.tensignal.backend.payment.ProviderCheckout;
import com.tensignal.backend.repository.PaymentTransactionRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentCheckoutPersistenceService {
    private final PaymentTransactionRepository transactionRepository;
    private final OwnerSessionService ownerSessionService;
    private final UserRepository userRepository;
    private final TenSignalRepository tenSignalRepository;

    @Transactional
    public PreparedCheckout prepare(String ownerToken, PaymentProduct product, String provider) {
        return prepare(ownerToken, product, provider, "USD");
    }

    @Transactional
    public PreparedCheckout prepare(String ownerToken, PaymentProduct product, String provider, String ignoredCurrency) {
        TenSignal tenSignal = ownerSessionService.authenticate(ownerToken);
        User user = getOrCreateUser(tenSignal);
        UUID transactionId = UUID.randomUUID();

        transactionRepository.saveAndFlush(PaymentTransaction.builder()
            .id(transactionId)
            .ownerAccountId(user.getId())
            .ownerProfileId(tenSignal.getId())
            .productCode(product.code())
            .entitlementType(product.entitlementType())
            .entitlementQuantity(product.capacityAmount())
            .provider(provider)
            .amountMinor(product.amountMinor())
            .currency("USD")
            .status(PaymentStatus.CREATED)
            .build());
        return new PreparedCheckout(transactionId, user.getId());
    }

    @Transactional
    public PaymentTransaction markPending(UUID transactionId, ProviderCheckout checkout) {
        PaymentTransaction transaction = transactionRepository.findByIdForUpdate(transactionId)
            .orElseThrow(() -> new InvalidPaymentEventException("Payment checkout record is unavailable."));
        if (transaction.getStatus() != PaymentStatus.CREATED) {
            throw new InvalidPaymentEventException("Payment checkout is not in a recoverable state.");
        }
        transaction.setProviderCheckoutId(checkout.providerCheckoutId());
        transaction.setStatus(PaymentStatus.PENDING);
        return transactionRepository.saveAndFlush(transaction);
    }

    private User getOrCreateUser(TenSignal tenSignal) {
        if (tenSignal.getUser() != null) return tenSignal.getUser();
        User user = userRepository.save(User.builder()
            .email(tenSignal.getEmail()).isPremium(false)
            .baseFormCapacity(AppConstants.DEFAULT_BASE_CAPACITY).purchasedExtraCapacity(0).build());
        tenSignal.setUser(user);
        tenSignalRepository.save(tenSignal);
        return user;
    }

    public record PreparedCheckout(UUID transactionId, UUID ownerAccountId) { }
}
