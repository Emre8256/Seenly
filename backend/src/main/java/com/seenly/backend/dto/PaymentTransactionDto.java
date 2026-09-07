package com.seenly.backend.dto;

import com.seenly.backend.payment.EntitlementReversalStatus;
import com.seenly.backend.payment.PaymentStatus;

import java.time.Instant;
import java.util.UUID;

public record PaymentTransactionDto(
    UUID transactionId,
    String productCode,
    String provider,
    long amountMinor,
    String currency,
    PaymentStatus status,
    Instant entitlementGrantedAt,
    EntitlementReversalStatus reversalStatus,
    Instant updatedAt
) { }
