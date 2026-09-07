package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.entity.PaymentTransaction;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import com.seenly.backend.exception.InvalidPaymentEventException;
import com.seenly.backend.payment.PaymentProduct;
import com.seenly.backend.payment.PaymentStatus;
import com.seenly.backend.payment.ProviderCheckout;
import com.seenly.backend.repository.PaymentTransactionRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
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
    private final SeenlyRepository seenlyRepository;

    @Transactional
    public PreparedCheckout prepare(String ownerToken, PaymentProduct product, String provider) {
        Seenly seenly = ownerSessionService.authenticate(ownerToken);
        User user = getOrCreateUser(seenly);
        UUID transactionId = UUID.randomUUID();
        transactionRepository.saveAndFlush(PaymentTransaction.builder()
            .id(transactionId)
            .ownerAccountId(user.getId())
            .ownerProfileId(seenly.getId())
            .productCode(product.code())
            .entitlementType(product.entitlementType())
            .entitlementQuantity(product.capacityAmount())
            .provider(provider)
            .amountMinor(product.amountMinor())
            .currency(product.currency())
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

    private User getOrCreateUser(Seenly seenly) {
        if (seenly.getUser() != null) return seenly.getUser();
        User user = userRepository.save(User.builder()
            .email(seenly.getEmail()).isPremium(false)
            .baseFormCapacity(AppConstants.DEFAULT_BASE_CAPACITY).purchasedExtraCapacity(0).build());
        seenly.setUser(user);
        seenlyRepository.save(seenly);
        return user;
    }

    public record PreparedCheckout(UUID transactionId, UUID ownerAccountId) { }
}
