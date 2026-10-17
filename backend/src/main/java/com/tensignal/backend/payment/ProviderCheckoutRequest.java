package com.tensignal.backend.payment;

import java.util.UUID;

public record ProviderCheckoutRequest(
    UUID internalTransactionId,
    UUID ownerAccountId,
    PaymentProduct product,
    String currency
) {
    public ProviderCheckoutRequest(UUID internalTransactionId, UUID ownerAccountId, PaymentProduct product) {
        this(internalTransactionId, ownerAccountId, product, "USD");
    }

    @Override
    public String toString() {
        return "ProviderCheckoutRequest[references=<redacted>, product=" + product.code() + ", currency=" + currency + "]";
    }
}
