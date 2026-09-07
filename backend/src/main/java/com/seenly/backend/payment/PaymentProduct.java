package com.seenly.backend.payment;

public record PaymentProduct(
    String code,
    EntitlementType entitlementType,
    int capacityAmount,
    long amountMinor,
    String currency,
    boolean active
) { }
