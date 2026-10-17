package com.tensignal.backend.dto;

import com.tensignal.backend.payment.EntitlementReversalStatus;
import com.tensignal.backend.payment.PaymentStatus;

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
