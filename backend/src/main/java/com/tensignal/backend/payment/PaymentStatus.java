package com.tensignal.backend.payment;

public enum PaymentStatus {
    CREATED,
    PENDING,
    PAID,
    FAILED,
    CANCELLED,
    EXPIRED,
    REFUNDED,
    PARTIALLY_REFUNDED,
    CHARGEBACK
}
