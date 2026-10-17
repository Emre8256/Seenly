package com.tensignal.backend.dto;

import com.tensignal.backend.payment.PaymentStatus;

import java.util.UUID;

public record PaymentWebhookResponse(
    boolean accepted,
    boolean duplicate,
    UUID transactionId,
    PaymentStatus status
) { }
