package com.seenly.backend.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seenly.backend.config.PaymentProperties;
import com.seenly.backend.exception.InvalidPaymentEventException;
import com.seenly.backend.exception.InvalidPaymentSignatureException;
import com.seenly.backend.exception.PaymentProviderUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Component
@Profile("test")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "test-hmac")
public class TestHmacPaymentProvider implements PaymentProvider {
    private final ObjectMapper objectMapper;
    private final PaymentProperties properties;

    @Override
    public String providerCode() {
        return "test-hmac";
    }

    @Override
    public ProviderCheckout createCheckout(ProviderCheckoutRequest request) {
        return new ProviderCheckout(
            "checkout_" + request.internalTransactionId(),
            "https://checkout.test.invalid/session/" + request.internalTransactionId()
        );
    }

    @Override
    public VerifiedPaymentEvent verifyAndParseWebhook(String signature, byte[] payload) {
        String secret = properties.getTestWebhookSecret();
        if (secret == null || secret.isBlank()) {
            throw new PaymentProviderUnavailableException("Test payment webhook secret is not configured.");
        }
        if (signature == null || signature.isBlank()) {
            throw new InvalidPaymentSignatureException();
        }
        byte[] supplied;
        try {
            String normalized = signature.startsWith("sha256=") ? signature.substring(7) : signature;
            supplied = HexFormat.of().parseHex(normalized);
        } catch (IllegalArgumentException ex) {
            throw new InvalidPaymentSignatureException();
        }
        byte[] expected = hmac(secret, payload);
        if (!MessageDigest.isEqual(expected, supplied)) {
            throw new InvalidPaymentSignatureException();
        }

        try {
            RawEvent event = objectMapper.readValue(payload, RawEvent.class);
            if (isBlank(event.eventId()) || isBlank(event.providerTransactionId())
                || isBlank(event.providerCheckoutId()) || isBlank(event.productCode())
                || isBlank(event.currency()) || event.type() == null || event.internalTransactionId() == null
                || event.ownerAccountId() == null || event.occurredAt() == null || event.amountMinor() < 0) {
                throw new InvalidPaymentEventException("Payment event is missing required fields.");
            }
            return new VerifiedPaymentEvent(event.eventId(), event.type(), event.providerTransactionId(),
                event.providerCheckoutId(), event.internalTransactionId(), event.ownerAccountId(),
                event.productCode(), event.amountMinor(), event.currency(), event.occurredAt());
        } catch (InvalidPaymentEventException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InvalidPaymentEventException("Malformed payment event payload.");
        }
    }

    private byte[] hmac(String secret, byte[] payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(payload);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to verify payment signature", ex);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record RawEvent(
        String eventId,
        PaymentEventType type,
        String providerTransactionId,
        String providerCheckoutId,
        UUID internalTransactionId,
        UUID ownerAccountId,
        String productCode,
        long amountMinor,
        String currency,
        Instant occurredAt
    ) { }
}
