package com.tensignal.backend.payment;

public enum PaymentEventType {
    PAYMENT_PAID,
    PAYMENT_FAILED,
    PAYMENT_CANCELLED,
    CHECKOUT_EXPIRED,
    PAYMENT_REFUNDED,
    PAYMENT_PARTIALLY_REFUNDED,
    PAYMENT_CHARGEBACK
}
