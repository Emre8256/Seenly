package com.tensignal.backend.payment;

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
    public boolean isIgnored() {
        return type == null;
    }

    public static VerifiedPaymentEvent ignored(String eventId, Instant occurredAt) {
        return new VerifiedPaymentEvent(
            eventId,
            null,
            null,
            null,
            null,
            null,
            null,
            0,
            null,
            occurredAt != null ? occurredAt : Instant.now()
        );
    }

    @Override
    public String toString() {
        return "VerifiedPaymentEvent[type=" + type + ", productCode=" + productCode
            + ", amountMinor=" + amountMinor + ", currency=" + currency + ", references=<redacted>]";
    }
}
