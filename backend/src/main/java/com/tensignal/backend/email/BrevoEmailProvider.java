package com.tensignal.backend.email;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Production email provider integrating Brevo's Transactional Email REST API.
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 *
 * Guarantees:
 * 1. Strict authentication via 'api-key' header.
 * 2. Centralized sender (mail@10signal.me) and default reply-to (10signal.me@gmail.com).
 * 3. Idempotency preservation via custom headers (X-Entity-Ref-ID).
 * 4. Resilient error classification (transient 429/5xx vs permanent 4xx).
 * 5. Secret redaction (never leaks Brevo API keys or recipient PII into logs).
 */
@Slf4j
public class BrevoEmailProvider implements EmailSender {

    public static final String DEFAULT_API_URL = "https://api.brevo.com/v3/smtp/email";
    public static final String DEFAULT_SENDER_EMAIL = "mail@10signal.me";
    public static final String DEFAULT_SENDER_NAME = "10Signal";
    public static final String DEFAULT_REPLY_TO = "10signal.me@gmail.com";
    public static final String PROVIDER_ID = "brevo";

    private static final Pattern SECRET_PATTERN = Pattern.compile("(xkeysib-[a-zA-Z0-9]+|re_[A-Za-z0-9_]+|api-key:\\s*[^\\s]+)");

    public record BrevoRawResponse(int statusCode, String responseBody) {}

    @FunctionalInterface
    public interface BrevoClientWrapper {
        BrevoRawResponse execute(String endpoint, String apiKey, String jsonPayload) throws Exception;
    }

    private final String apiKey;
    private final String senderEmail;
    private final String senderName;
    private final String defaultReplyTo;
    private final String apiUrl;
    private final BrevoClientWrapper clientWrapper;
    private final ObjectMapper objectMapper;

    public BrevoEmailProvider(String apiKey, String senderEmail, String senderName, String defaultReplyTo, ObjectMapper objectMapper) {
        this(apiKey, senderEmail, senderName, defaultReplyTo, DEFAULT_API_URL, 5000, 10000, objectMapper);
    }

    public BrevoEmailProvider(
            String apiKey,
            String senderEmail,
            String senderName,
            String defaultReplyTo,
            String apiUrl,
            int connectTimeoutMs,
            int readTimeoutMs,
            ObjectMapper objectMapper) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("BREVO_API_KEY must not be null or blank");
        }
        this.apiKey = apiKey.trim();
        this.senderEmail = (senderEmail != null && !senderEmail.isBlank()) ? senderEmail.trim() : DEFAULT_SENDER_EMAIL;
        this.senderName = (senderName != null && !senderName.isBlank()) ? senderName.trim() : DEFAULT_SENDER_NAME;
        this.defaultReplyTo = (defaultReplyTo != null && !defaultReplyTo.isBlank()) ? defaultReplyTo.trim() : DEFAULT_REPLY_TO;
        this.apiUrl = (apiUrl != null && !apiUrl.isBlank()) ? apiUrl.trim() : DEFAULT_API_URL;
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");

        HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(Math.max(1000, connectTimeoutMs)))
            .build();

        this.clientWrapper = (endpoint, key, payload) -> {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofMillis(Math.max(1000, readTimeoutMs)))
                .header("api-key", key)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            return new BrevoRawResponse(response.statusCode(), response.body());
        };
    }

    public BrevoEmailProvider(
            BrevoClientWrapper clientWrapper,
            String apiKey,
            String senderEmail,
            String senderName,
            String defaultReplyTo,
            ObjectMapper objectMapper) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("BREVO_API_KEY must not be null or blank");
        }
        this.apiKey = apiKey.trim();
        this.clientWrapper = Objects.requireNonNull(clientWrapper, "clientWrapper must not be null");
        this.senderEmail = (senderEmail != null && !senderEmail.isBlank()) ? senderEmail.trim() : DEFAULT_SENDER_EMAIL;
        this.senderName = (senderName != null && !senderName.isBlank()) ? senderName.trim() : DEFAULT_SENDER_NAME;
        this.defaultReplyTo = (defaultReplyTo != null && !defaultReplyTo.isBlank()) ? defaultReplyTo.trim() : DEFAULT_REPLY_TO;
        this.apiUrl = DEFAULT_API_URL;
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
    }

    @Override
    public EmailSendResult send(EmailMessage message) {
        Objects.requireNonNull(message, "message must not be null");

        try {
            // Build Reply-To (per-message or centralized default)
            String effectiveReplyTo = (message.getReplyTo() != null && !message.getReplyTo().isBlank())
                ? message.getReplyTo().trim()
                : this.defaultReplyTo;

            ReplyToDto replyToDto = ReplyToDto.builder()
                .email(effectiveReplyTo)
                .name(senderName)
                .build();

            // Headers: X-Notification-Type and optional X-Entity-Ref-ID (idempotency)
            Map<String, String> headers = new LinkedHashMap<>();
            if (message.getNotificationType() != null && !message.getNotificationType().isBlank()) {
                headers.put("X-Notification-Type", message.getNotificationType().trim());
            }
            if (message.getIdempotencyKey() != null && !message.getIdempotencyKey().isBlank()) {
                headers.put("X-Entity-Ref-ID", message.getIdempotencyKey().trim());
            }

            // Tags: lowercase normalized identifier (max 50 chars, alphanumeric/hyphen/underscore)
            List<String> tags = new ArrayList<>();
            if (message.getNotificationType() != null && !message.getNotificationType().isBlank()) {
                String sanitizedTag = message.getNotificationType()
                    .toLowerCase(Locale.ROOT)
                    .replaceAll("[^a-z0-9_-]", "_");
                if (sanitizedTag.length() > 50) {
                    sanitizedTag = sanitizedTag.substring(0, 50);
                }
                tags.add(sanitizedTag);
            }

            BrevoEmailRequest requestPayload = BrevoEmailRequest.builder()
                .sender(SenderDto.builder().name(senderName).email(senderEmail).build())
                .to(List.of(RecipientDto.builder().email(message.getTo().trim()).build()))
                .replyTo(replyToDto)
                .subject(message.getSubject())
                .htmlContent(message.getHtmlBody())
                .textContent(message.getTextBody())
                .headers(headers.isEmpty() ? null : headers)
                .tags(tags.isEmpty() ? null : tags)
                .build();

            String jsonBody = objectMapper.writeValueAsString(requestPayload);
            BrevoRawResponse response = clientWrapper.execute(apiUrl, apiKey, jsonBody);

            int statusCode = response.statusCode();
            String responseBody = response.responseBody();

            if (statusCode == 201 || statusCode == 200) {
                String messageId = extractMessageId(responseBody);
                log.info("Email delivered via Brevo (type={}, messageId={})", message.getNotificationType(), messageId);
                return EmailSendResult.success(messageId);
            }

            boolean retryable = isRetryableStatusCode(statusCode);
            String safeError = extractAndSanitizeErrorMessage(responseBody, statusCode);

            log.warn("Brevo email delivery failed for type={}, status={}, retryable={}: {}",
                message.getNotificationType(), statusCode, retryable, safeError);

            return EmailSendResult.failure(safeError, retryable);

        } catch (Exception ex) {
            boolean retryable = isTransientNetworkException(ex);
            String safeError = sanitizeErrorMessage(ex.getMessage(), null);

            log.error("Unexpected error sending email via Brevo for type={}, retryable={}: {}",
                message.getNotificationType(), retryable, safeError);

            return EmailSendResult.failure(safeError, retryable);
        }
    }

    @Override
    public String getProviderId() {
        return PROVIDER_ID;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public String getSenderName() {
        return senderName;
    }

    public String getDefaultReplyTo() {
        return defaultReplyTo;
    }

    private String extractMessageId(String body) {
        if (body == null || body.isBlank()) {
            return "brevo-success-empty-body";
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            if (root.hasNonNull("messageId")) {
                return root.get("messageId").asText();
            }
            if (root.hasNonNull("messageIds") && root.get("messageIds").isArray() && !root.get("messageIds").isEmpty()) {
                return root.get("messageIds").get(0).asText();
            }
        } catch (Exception ex) {
            log.debug("Could not parse messageId from Brevo response: {}", ex.getMessage());
        }
        return "brevo-accepted";
    }

    private String extractAndSanitizeErrorMessage(String body, int statusCode) {
        String parsedMessage = null;
        if (body != null && !body.isBlank()) {
            try {
                JsonNode root = objectMapper.readTree(body);
                if (root.hasNonNull("message")) {
                    parsedMessage = root.get("message").asText();
                } else if (root.hasNonNull("error")) {
                    parsedMessage = root.get("error").asText();
                } else if (root.hasNonNull("code")) {
                    parsedMessage = root.get("code").asText();
                }
            } catch (Exception ignored) {
                parsedMessage = body.length() > 100 ? body.substring(0, 100) : body;
            }
        }
        String formatted = parsedMessage != null
            ? "Brevo HTTP " + statusCode + ": " + parsedMessage
            : "Brevo HTTP error: " + statusCode;
        return sanitizeErrorMessage(formatted, statusCode);
    }

    public static boolean isRetryableStatusCode(Integer statusCode) {
        if (statusCode == null) {
            return true; // Network/timeout without status code is transient
        }
        if (statusCode == 429) {
            return true; // Rate limiting is retryable
        }
        if (statusCode >= 500) {
            return true; // Server errors (500, 502, 503, 504) are retryable
        }
        // Client errors (400, 401, 403, 404, 422, etc.) are terminal
        return false;
    }

    public static boolean isTransientNetworkException(Throwable ex) {
        if (ex == null) return false;
        if (ex instanceof SocketTimeoutException
            || ex instanceof ConnectException
            || ex instanceof UnknownHostException
            || ex instanceof HttpTimeoutException) {
            return true;
        }
        if (ex instanceof IOException) {
            String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase(Locale.ROOT) : "";
            if (msg.contains("timeout") || msg.contains("reset") || msg.contains("connection") || msg.contains("broken pipe")) {
                return true;
            }
        }
        if (ex.getCause() != null && ex.getCause() != ex) {
            return isTransientNetworkException(ex.getCause());
        }
        return false;
    }

    public String sanitizeErrorMessage(String rawMessage, Integer statusCode) {
        if (rawMessage == null || rawMessage.isBlank()) {
            return statusCode != null ? "Brevo HTTP error: " + statusCode : "Brevo request failed";
        }
        String sanitized = rawMessage;
        if (apiKey != null && !apiKey.isBlank()) {
            sanitized = sanitized.replace(apiKey, "[REDACTED_API_KEY]");
        }
        sanitized = SECRET_PATTERN.matcher(sanitized).replaceAll("[REDACTED_SECRET]");
        if (sanitized.length() > 250) {
            sanitized = sanitized.substring(0, 250) + "...";
        }
        return sanitized;
    }

    // --- JSON DTOs matching Brevo REST API v3 ---

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BrevoEmailRequest {
        private final SenderDto sender;
        private final List<RecipientDto> to;
        private final ReplyToDto replyTo;
        private final String subject;
        private final String htmlContent;
        private final String textContent;
        private final Map<String, String> headers;
        private final List<String> tags;
    }

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SenderDto {
        private final String name;
        private final String email;
    }

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RecipientDto {
        private final String email;
        private final String name;
    }

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ReplyToDto {
        private final String email;
        private final String name;
    }
}
