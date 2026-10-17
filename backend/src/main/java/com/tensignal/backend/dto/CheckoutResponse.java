package com.tensignal.backend.dto;

import com.tensignal.backend.payment.PaymentStatus;

import java.util.UUID;

public record CheckoutResponse(
    UUID transactionId,
    String provider,
    String providerCheckoutId,
    String checkoutUrl,
    PaymentStatus status
) {
    @Override
    public String toString() {
        return "CheckoutResponse[provider=" + provider + ", providerCheckoutId=<redacted>, "
            + "checkoutUrl=<redacted>, status=" + status + "]";
    }
}
