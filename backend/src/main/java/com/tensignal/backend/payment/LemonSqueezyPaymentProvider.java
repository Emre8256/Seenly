package com.tensignal.backend.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.config.PaymentProperties;
import com.tensignal.backend.exception.InvalidPaymentEventException;
import com.tensignal.backend.exception.InvalidPaymentSignatureException;
import com.tensignal.backend.exception.PaymentProviderUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "lemonsqueezy")
public class LemonSqueezyPaymentProvider implements PaymentProvider {

    private final ObjectMapper objectMapper;
    private final PaymentProperties properties;

    @Override
    public String providerCode() {
        return "lemonsqueezy";
    }

    @Override
    public ProviderCheckout createCheckout(ProviderCheckoutRequest request) {
        String productCode = request.product().code();
        String baseUrl = properties.getLemonSqueezy().getCheckoutUrl(productCode);
        if (baseUrl == null) {
            throw new PaymentProviderUnavailableException(
                "Product " + productCode + " is not supported by Lemon Squeezy provider.");
        }
        if (baseUrl.isBlank()) {
            throw new PaymentProviderUnavailableException(
                "Lemon Squeezy checkout URL for " + productCode + " is not configured.");
        }

        String providerCheckoutId = "ls_chk_" + request.internalTransactionId();

        StringBuilder urlBuilder = new StringBuilder(baseUrl);
        char separator = baseUrl.contains("?") ? '&' : '?';

        appendQueryParam(urlBuilder, separator, "checkout[custom][transaction_id]", request.internalTransactionId().toString());
        appendQueryParam(urlBuilder, '&', "checkout[custom][owner_account_id]", request.ownerAccountId().toString());
        appendQueryParam(urlBuilder, '&', "checkout[custom][product_code]", request.product().code());
        appendQueryParam(urlBuilder, '&', "checkout[custom][checkout_id]", providerCheckoutId);

        return new ProviderCheckout(providerCheckoutId, urlBuilder.toString());
    }

    @Override
    public VerifiedPaymentEvent verifyAndParseWebhook(String signature, byte[] payload) {
        String secret = properties.getLemonSqueezy().getWebhookSecret();
        if (secret == null || secret.isBlank()) {
            throw new PaymentProviderUnavailableException("Lemon Squeezy webhook secret is not configured.");
        }

        if (signature == null || signature.isBlank()) {
            throw new InvalidPaymentSignatureException();
        }

        byte[] supplied;
        try {
            String normalized = signature.startsWith("sha256=") ? signature.substring(7).trim() : signature.trim();
            supplied = HexFormat.of().parseHex(normalized);
        } catch (IllegalArgumentException ex) {
            throw new InvalidPaymentSignatureException();
        }

        byte[] expected = hmac(secret, payload);
        if (!MessageDigest.isEqual(expected, supplied)) {
            throw new InvalidPaymentSignatureException();
        }

        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode metaNode = root.path("meta");
            String eventName = metaNode.path("event_name").asText(null);

            if (isBlank(eventName)) {
                throw new InvalidPaymentEventException("Missing event_name in Lemon Squeezy webhook payload.");
            }

            JsonNode dataNode = root.path("data");
            JsonNode attributesNode = dataNode.path("attributes");
            JsonNode customDataNode = metaNode.path("custom_data");

            PaymentEventType eventType = mapEventType(eventName, attributesNode.path("status").asText(""));
            if (eventType == null) {
                String eventId = "ls:" + eventName.toLowerCase(Locale.ROOT) + ":"
                    + (dataNode.hasNonNull("id") ? dataNode.path("id").asText() : UUID.randomUUID().toString());
                return VerifiedPaymentEvent.ignored(eventId, parseInstant(attributesNode.path("created_at").asText(null)));
            }

            String transactionIdStr = customDataNode.path("transaction_id").asText(null);
            String ownerAccountIdStr = customDataNode.path("owner_account_id").asText(null);
            String productCode = customDataNode.path("product_code").asText(null);
            String checkoutId = customDataNode.path("checkout_id").asText(null);

            if (isBlank(transactionIdStr) || isBlank(ownerAccountIdStr) || isBlank(productCode)) {
                throw new InvalidPaymentEventException("Lemon Squeezy custom_data is missing required transaction metadata.");
            }

            UUID internalTransactionId = UUID.fromString(transactionIdStr.trim());
            UUID ownerAccountId = UUID.fromString(ownerAccountIdStr.trim());

            if (isBlank(checkoutId)) {
                checkoutId = "ls_chk_" + internalTransactionId;
            }

            String providerTransactionId = dataNode.path("id").asText(null);
            if (isBlank(providerTransactionId)) {
                providerTransactionId = attributesNode.path("identifier").asText(null);
            }
            if (isBlank(providerTransactionId)) {
                providerTransactionId = attributesNode.path("order_number").asText(null);
            }

            long amountMinor = attributesNode.path("total").asLong(-1);
            String currency = attributesNode.path("currency").asText(null);

            String createdAtStr = attributesNode.path("created_at").asText(null);
            Instant occurredAt = parseInstant(createdAtStr);

            String eventId = "ls:" + eventName.toLowerCase(Locale.ROOT) + ":" + providerTransactionId;

            if (isBlank(providerTransactionId) || isBlank(currency) || amountMinor < 0) {
                throw new InvalidPaymentEventException("Lemon Squeezy order attributes are missing required fields.");
            }

            return new VerifiedPaymentEvent(
                eventId,
                eventType,
                providerTransactionId,
                checkoutId,
                internalTransactionId,
                ownerAccountId,
                productCode,
                amountMinor,
                currency.toUpperCase(Locale.ROOT),
                occurredAt
            );
        } catch (InvalidPaymentEventException | InvalidPaymentSignatureException | PaymentProviderUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InvalidPaymentEventException("Malformed Lemon Squeezy payment event payload.");
        }
    }

    private PaymentEventType mapEventType(String eventName, String status) {
        String normalizedEvent = eventName.toLowerCase(Locale.ROOT);
        String normalizedStatus = status.toLowerCase(Locale.ROOT);

        return switch (normalizedEvent) {
            case "order_created" -> {
                if ("paid".equals(normalizedStatus)) {
                    yield PaymentEventType.PAYMENT_PAID;
                } else if ("refunded".equals(normalizedStatus)) {
                    yield PaymentEventType.PAYMENT_REFUNDED;
                } else if ("failed".equals(normalizedStatus)) {
                    yield PaymentEventType.PAYMENT_FAILED;
                } else if ("cancelled".equals(normalizedStatus) || "canceled".equals(normalizedStatus)) {
                    yield PaymentEventType.PAYMENT_CANCELLED;
                } else if ("expired".equals(normalizedStatus)) {
                    yield PaymentEventType.CHECKOUT_EXPIRED;
                } else if ("chargeback".equals(normalizedStatus) || "disputed".equals(normalizedStatus)) {
                    yield PaymentEventType.PAYMENT_CHARGEBACK;
                }
                yield null;
            }
            case "order_refunded" -> PaymentEventType.PAYMENT_REFUNDED;
            case "order_chargeback", "chargeback", "dispute_created", "order_dispute" -> PaymentEventType.PAYMENT_CHARGEBACK;
            default -> null;
        };
    }

    private Instant parseInstant(String text) {
        if (isBlank(text)) {
            return Instant.now();
        }
        try {
            return Instant.parse(text);
        } catch (DateTimeParseException ex) {
            return Instant.now();
        }
    }

    private byte[] hmac(String secret, byte[] payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(payload);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to compute Lemon Squeezy payment signature", ex);
        }
    }

    private void appendQueryParam(StringBuilder sb, char prefix, String key, String value) {
        sb.append(prefix);
        sb.append(URLEncoder.encode(key, StandardCharsets.UTF_8));
        sb.append('=');
        sb.append(URLEncoder.encode(value, StandardCharsets.UTF_8));
    }

    private boolean isBlank(String str) {
        return str == null || str.isBlank();
    }
}
