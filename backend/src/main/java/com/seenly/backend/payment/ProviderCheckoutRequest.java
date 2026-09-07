package com.seenly.backend.payment;

import java.util.UUID;

public record ProviderCheckoutRequest(
    UUID internalTransactionId,
    UUID ownerAccountId,
    PaymentProduct product
) {
    @Override
    public String toString() {
        return "ProviderCheckoutRequest[references=<redacted>, product=" + product.code() + "]";
    }
}
