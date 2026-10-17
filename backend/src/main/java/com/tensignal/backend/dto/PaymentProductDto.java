package com.tensignal.backend.dto;

import com.tensignal.backend.payment.EntitlementType;

public record PaymentProductDto(
    String productCode,
    EntitlementType entitlementType,
    int capacityAmount,
    long amountMinor,
    String currency,
    String formattedPrice
) {
    public PaymentProductDto(String productCode, EntitlementType entitlementType, int capacityAmount, long amountMinor, String currency) {
        this(productCode, entitlementType, capacityAmount, amountMinor, currency, null);
    }
}

