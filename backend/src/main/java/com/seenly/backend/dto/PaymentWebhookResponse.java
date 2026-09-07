package com.seenly.backend.dto;

import com.seenly.backend.payment.PaymentStatus;

import java.util.UUID;

public record PaymentWebhookResponse(
    boolean accepted,
    boolean duplicate,
    UUID transactionId,
    PaymentStatus status
) { }
