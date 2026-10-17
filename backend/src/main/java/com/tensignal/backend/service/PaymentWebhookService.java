package com.tensignal.backend.service;

import com.tensignal.backend.dto.PaymentWebhookResponse;
import com.tensignal.backend.exception.InvalidPaymentEventException;
import com.tensignal.backend.payment.PaymentProvider;
import com.tensignal.backend.payment.VerifiedPaymentEvent;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataAccessException;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentWebhookService {
    private final PaymentProvider paymentProvider;
    private final PaymentEventProcessor eventProcessor;
    private final AuditLogService auditLogService;
    private final ApplicationMetrics metrics;

    public PaymentWebhookResponse handle(String provider, String signature, byte[] payload) {
        try {
            if (!paymentProvider.providerCode().equals(provider)) {
                throw new InvalidPaymentEventException("Unsupported payment provider.");
            }
            VerifiedPaymentEvent event = paymentProvider.verifyAndParseWebhook(signature, payload);
            return eventProcessor.process(provider, event, digest(payload));
        } catch (RuntimeException ex) {
            if (ex instanceof DataAccessException) {
                metrics.resilienceFailure("webhook");
                auditLogService.record(AuditEvent.INFRASTRUCTURE_FAILURE, "failure",
                    Map.of("reason", "webhook"));
                throw ex;
            }
            metrics.paymentWebhook("UNKNOWN", "rejected");
            auditLogService.record(AuditEvent.PAYMENT_EVENT_REJECTED, "failure", Map.of(
                "provider", provider == null ? "unknown" : provider,
                "reason", ex.getClass().getSimpleName()));
            throw ex;
        }
    }

    private String digest(byte[] payload) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
