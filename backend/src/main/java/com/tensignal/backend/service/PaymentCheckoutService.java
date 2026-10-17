package com.tensignal.backend.service;

import com.tensignal.backend.dto.CheckoutResponse;
import com.tensignal.backend.dto.PaymentProductDto;
import com.tensignal.backend.dto.PaymentTransactionDto;
import com.tensignal.backend.entity.PaymentTransaction;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.exception.InvalidPaymentEventException;
import com.tensignal.backend.exception.PaymentProviderUnavailableException;
import com.tensignal.backend.payment.*;
import com.tensignal.backend.repository.PaymentTransactionRepository;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
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
            .map(product -> new PaymentProductDto(
                product.code(),
                product.entitlementType(),
                product.capacityAmount(),
                product.amountMinor(),
                "USD",
                product.formattedPrice()
            ))
            .toList();
    }

    public List<PaymentProductDto> products(String ignoredCurrency) {
        return products();
    }

    public CheckoutResponse createCheckout(String ownerToken, String productCode) {
        return createCheckout(ownerToken, productCode, "USD");
    }

    public CheckoutResponse createCheckout(String ownerToken, String productCode, String ignoredCurrency) {
        PaymentProduct product = productCatalog.requireActive(productCode);
        PaymentCheckoutPersistenceService.PreparedCheckout prepared =
            persistenceService.prepare(ownerToken, product, paymentProvider.providerCode(), "USD");
        try {
            ProviderCheckout checkout = paymentProvider.createCheckout(
                new ProviderCheckoutRequest(prepared.transactionId(), prepared.ownerAccountId(), product, "USD"));
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
        TenSignal tenSignal = ownerSessionService.authenticate(ownerToken);
        PaymentTransaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new InvalidPaymentEventException("Payment transaction was not found."));
        if (tenSignal.getUser() == null || !transaction.getOwnerAccountId().equals(tenSignal.getUser().getId())) {
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
