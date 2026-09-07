package com.seenly.backend.dto;

import com.seenly.backend.payment.EntitlementType;

public record PaymentProductDto(
    String productCode,
    EntitlementType entitlementType,
    int capacityAmount,
    long amountMinor,
    String currency
) { }
