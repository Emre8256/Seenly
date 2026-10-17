package com.tensignal.backend.email;

import lombok.Builder;
import lombok.Getter;

import java.util.Objects;
import java.util.regex.Pattern;

@Getter
@Builder
public class EmailMessage {

    private static final Pattern CRLF_PATTERN = Pattern.compile("[\r\n]");

    private final String to;
    private final String subject;
    private final String htmlBody;
    private final String textBody;
    private final String notificationType;
    private final String replyTo;
    private final String idempotencyKey;

    public EmailMessage(String to, String subject, String htmlBody, String textBody, String notificationType, String replyTo) {
        this(to, subject, htmlBody, textBody, notificationType, replyTo, null);
    }

    public EmailMessage(String to, String subject, String htmlBody, String textBody, String notificationType, String replyTo, String idempotencyKey) {
        this.to = validateNoCrlf("to", Objects.requireNonNull(to, "Recipient 'to' cannot be null")).trim();
        this.subject = validateNoCrlf("subject", Objects.requireNonNull(subject, "Subject cannot be null")).trim();
        this.htmlBody = Objects.requireNonNull(htmlBody, "HTML body cannot be null");
        this.textBody = Objects.requireNonNull(textBody, "Text body cannot be null");
        this.notificationType = Objects.requireNonNull(notificationType, "Notification type cannot be null");
        this.replyTo = replyTo != null && !replyTo.isBlank() ? validateNoCrlf("replyTo", replyTo).trim() : null;
        this.idempotencyKey = idempotencyKey != null && !idempotencyKey.isBlank() ? validateNoCrlf("idempotencyKey", idempotencyKey).trim() : null;
    }

    private static String validateNoCrlf(String fieldName, String value) {
        if (CRLF_PATTERN.matcher(value).find()) {
            throw new IllegalArgumentException("Header injection rejected: " + fieldName + " contains CRLF characters.");
        }
        return value;
    }

    @Override
    public String toString() {
        return "EmailMessage[to=<redacted>, subject=" + subject + ", notificationType=" + notificationType + "]";
    }
}
