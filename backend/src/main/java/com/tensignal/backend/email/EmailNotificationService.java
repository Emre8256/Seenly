package com.tensignal.backend.email;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.entity.EmailOutboxEntity;
import com.tensignal.backend.entity.EmailOutboxStatus;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import com.tensignal.backend.repository.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private final EmailOutboxRepository outboxRepository;
    private final UserNotificationPreferencesService preferencesService;
    private final OtpPayloadCryptoService cryptoService;
    private final ObjectMapper objectMapper;
    private final AuditLogService auditLogService;
    private final ApplicationMetrics metrics;
    private final Clock clock;

    @Transactional
    public Optional<EmailOutboxEntity> enqueue(
            NotificationType type,
            String recipient,
            UUID userId,
            String locale,
            Map<String, Object> contextVariables,
            String idempotencyKey,
            Instant scheduledAt,
            Instant expiresAt) {

        if (recipient == null || recipient.isBlank()) {
            log.warn("Attempted to enqueue notification {} with blank recipient", type);
            return Optional.empty();
        }

        String normalizedRecipient = recipient.trim().toLowerCase(Locale.ROOT);
        String recipientHash = hashRecipient(normalizedRecipient);

        // Check user notification preferences
        if (!preferencesService.isAllowed(userId, type)) {
            log.info("Notification {} skipped by user preference for userId={}", type, userId);
            metrics.emailSkipped(type.name(), "user_preference");
            auditLogService.record(AuditEvent.EMAIL_SKIPPED, "user_preference", Map.of("type", type.name()));
            return Optional.empty();
        }

        Instant now = clock.instant();
        Instant effectiveScheduledAt = scheduledAt != null ? scheduledAt : now;

        // Check existing idempotency key
        Optional<EmailOutboxEntity> existingOpt = outboxRepository.findByIdempotencyKey(idempotencyKey);
        if (existingOpt.isPresent()) {
            EmailOutboxEntity existing = existingOpt.get();
            // Debounce aggregation for NEW_EVALUATION
            if (type == NotificationType.NEW_EVALUATION && existing.getStatus() == EmailOutboxStatus.PENDING) {
                try {
                    Map<String, Object> payload = objectMapper.readValue(
                        existing.getPayloadJson(), new TypeReference<Map<String, Object>>() {}
                    );
                    int currentCount = ((Number) payload.getOrDefault("count", 1)).intValue();
                    payload.put("count", currentCount + 1);
                    existing.setPayloadJson(objectMapper.writeValueAsString(payload));
                    outboxRepository.save(existing);
                    log.info("Aggregated evaluation count to {} for outbox item {}", currentCount + 1, existing.getId());
                    return Optional.of(existing);
                } catch (Exception ex) {
                    log.warn("Failed to increment evaluation debounce payload: {}", ex.getMessage());
                }
            }
            log.debug("Notification with idempotencyKey={} already enqueued. Skipping.", idempotencyKey);
            return Optional.of(existing);
        }

        String payloadJson;
        try {
            if (type.isOtp()) {
                payloadJson = cryptoService.encryptPayload(contextVariables);
            } else {
                payloadJson = objectMapper.writeValueAsString(contextVariables);
            }
        } catch (Exception ex) {
            log.error("Failed to serialize notification payload for type={}", type);
            throw new IllegalStateException("Could not serialize payload", ex);
        }

        EmailOutboxEntity entity = EmailOutboxEntity.builder()
            .userId(userId)
            .notificationType(type.name())
            .recipient(normalizedRecipient)
            .recipientHash(recipientHash)
            .locale(locale != null && !locale.isBlank() ? locale.trim().toLowerCase(java.util.Locale.ROOT) : "en")
            .payloadJson(payloadJson)
            .status(EmailOutboxStatus.PENDING)
            .scheduledAt(effectiveScheduledAt)
            .nextAttemptAt(effectiveScheduledAt)
            .attempts(0)
            .maxAttempts(5)
            .expiresAt(expiresAt)
            .idempotencyKey(idempotencyKey)
            .build();

        EmailOutboxEntity saved = outboxRepository.save(entity);
        auditLogService.record(AuditEvent.EMAIL_ENQUEUED, "success", Map.of("type", type.name()));
        log.info("Enqueued notification {} (idempotencyKey={})", type, idempotencyKey);
        return Optional.of(saved);
    }

    @Transactional
    public Optional<EmailOutboxEntity> enqueueOtp(
            NotificationType type,
            String recipient,
            String code,
            Instant expiresAt,
            String idempotencyKey,
            String locale) {

        Map<String, Object> context = Map.of(
            "code", code,
            "loginUrl", "https://10signal.me/login",
            "registerUrl", "https://10signal.me/register",
            "securityUrl", "https://10signal.me/settings/security"
        );

        String effectiveLocale = (locale != null && (locale.equalsIgnoreCase("tr") || locale.equalsIgnoreCase("en")))
            ? locale.trim().toLowerCase(java.util.Locale.ROOT)
            : "en";

        return enqueue(
            type,
            recipient,
            null,
            effectiveLocale,
            context,
            idempotencyKey,
            clock.instant(),
            expiresAt
        );
    }

    @Transactional
    public Optional<EmailOutboxEntity> enqueueOtp(
            NotificationType type,
            String recipient,
            String code,
            Instant expiresAt,
            String idempotencyKey) {
        return enqueueOtp(type, recipient, code, expiresAt, idempotencyKey, "en");
    }

    public static String hashRecipient(String email) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(email.getBytes(StandardCharsets.UTF_8));
            HexFormat hex = HexFormat.of();
            return hex.formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public static String redactEmail(String email) {
        if (email == null || email.isBlank()) return "<empty>";
        int atIdx = email.indexOf('@');
        if (atIdx <= 1) return "***" + (atIdx >= 0 ? email.substring(atIdx) : "");
        return email.charAt(0) + "***" + email.substring(atIdx);
    }
}
