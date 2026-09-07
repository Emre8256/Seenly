package com.seenly.backend.service;

import com.seenly.backend.dto.CheckoutResponse;
import com.seenly.backend.dto.PaymentProductDto;
import com.seenly.backend.dto.PaymentTransactionDto;
import com.seenly.backend.entity.PaymentTransaction;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.exception.InvalidPaymentEventException;
import com.seenly.backend.exception.PaymentProviderUnavailableException;
import com.seenly.backend.payment.*;
import com.seenly.backend.repository.PaymentTransactionRepository;
import com.seenly.backend.observability.ApplicationMetrics;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataAccessException;

import java.util.List;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentCheckoutService {
    private final PaymentProductCatalog productCatalog;
    private final PaymentProvider paymentProvider;
    private final PaymentTransactionRepository transactionRepository;
    private final OwnerSessionService ownerSessionService;
    private final PaymentCheckoutPersistenceService persistenceService;
    private final AuditLogService auditLogService;
    private final ApplicationMetrics metrics;

    public List<PaymentProductDto> products() {
        return productCatalog.activeProducts().stream()
            .map(product -> new PaymentProductDto(product.code(), product.entitlementType(),
                product.capacityAmount(), product.amountMinor(), product.currency()))
            .toList();
    }

    public CheckoutResponse createCheckout(String ownerToken, String productCode) {
        PaymentProduct product = productCatalog.requireActive(productCode);
        PaymentCheckoutPersistenceService.PreparedCheckout prepared =
            persistenceService.prepare(ownerToken, product, paymentProvider.providerCode());
        try {
            ProviderCheckout checkout = paymentProvider.createCheckout(
                new ProviderCheckoutRequest(prepared.transactionId(), prepared.ownerAccountId(), product));
            if (checkout == null || checkout.providerCheckoutId() == null || checkout.providerCheckoutId().isBlank()
                || checkout.checkoutUrl() == null || checkout.checkoutUrl().isBlank()) {
                throw new PaymentProviderUnavailableException("Payment checkout is temporarily unavailable.");
            }
            PaymentTransaction transaction = persistenceService.markPending(prepared.transactionId(), checkout);
            metrics.checkout("success");
            auditLogService.record(AuditEvent.CHECKOUT_CREATED, "success", Map.of(
                "provider", transaction.getProvider(), "product", product.code()));
            return new CheckoutResponse(prepared.transactionId(), transaction.getProvider(), checkout.providerCheckoutId(),
                checkout.checkoutUrl(), transaction.getStatus());
        } catch (RuntimeException ex) {
            metrics.checkout("failure");
            if (ex instanceof DataAccessException) {
                metrics.resilienceFailure("transaction");
                throw ex;
            }
            metrics.resilienceFailure("payment_provider");
            auditLogService.record(AuditEvent.PAYMENT_PROVIDER_FAILED, "failure", Map.of(
                "provider", paymentProvider.providerCode(), "reason", ex.getClass().getSimpleName()));
            if (ex instanceof PaymentProviderUnavailableException) throw ex;
            throw new PaymentProviderUnavailableException("Payment checkout is temporarily unavailable.");
        }
    }

    @Transactional(readOnly = true)
    public PaymentTransactionDto getTransaction(String ownerToken, UUID transactionId) {
        Seenly seenly = ownerSessionService.authenticate(ownerToken);
        PaymentTransaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new InvalidPaymentEventException("Payment transaction was not found."));
        if (seenly.getUser() == null || !transaction.getOwnerAccountId().equals(seenly.getUser().getId())) {
            throw new InvalidPaymentEventException("Payment transaction was not found.");
        }
        return toDto(transaction);
    }

    private PaymentTransactionDto toDto(PaymentTransaction transaction) {
        return new PaymentTransactionDto(transaction.getId(), transaction.getProductCode(), transaction.getProvider(),
            transaction.getAmountMinor(), transaction.getCurrency(), transaction.getStatus(),
            transaction.getEntitlementGrantedAt(), transaction.getReversalStatus(), transaction.getUpdatedAt());
    }

}
