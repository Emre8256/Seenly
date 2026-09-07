package com.seenly.backend.payment;

import java.time.Instant;
import java.util.UUID;

public record VerifiedPaymentEvent(
    String eventId,
    PaymentEventType type,
    String providerTransactionId,
    String providerCheckoutId,
    UUID internalTransactionId,
    UUID ownerAccountId,
    String productCode,
    long amountMinor,
    String currency,
    Instant occurredAt
) {
    @Override
    public String toString() {
        return "VerifiedPaymentEvent[type=" + type + ", productCode=" + productCode
            + ", amountMinor=" + amountMinor + ", currency=" + currency + ", references=<redacted>]";
    }
}
