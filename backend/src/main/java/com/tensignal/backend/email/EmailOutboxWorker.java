package com.tensignal.backend.email;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.entity.EmailOutboxEntity;
import com.tensignal.backend.entity.EmailOutboxStatus;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import com.tensignal.backend.repository.EmailOutboxRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
public class EmailOutboxWorker {

    private final EmailOutboxRepository outboxRepository;
    private final EmailSender emailSender;
    private final EmailTemplateService emailTemplateService;
    private final OtpPayloadCryptoService cryptoService;
    private final TenSignalRepository tenSignalRepository;
    private final UserRepository userRepository;
    private final UserNotificationPreferencesService preferencesService;
    private final ApplicationMetrics metrics;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Autowired
    public EmailOutboxWorker(
            EmailOutboxRepository outboxRepository,
            EmailSender emailSender,
            EmailTemplateService emailTemplateService,
            OtpPayloadCryptoService cryptoService,
            TenSignalRepository tenSignalRepository,
            UserRepository userRepository,
            UserNotificationPreferencesService preferencesService,
            ApplicationMetrics metrics,
            AuditLogService auditLogService,
            ObjectMapper objectMapper,
            Clock clock
    ) {
        this.outboxRepository = outboxRepository;
        this.emailSender = emailSender;
        this.emailTemplateService = emailTemplateService;
        this.cryptoService = cryptoService;
        this.tenSignalRepository = tenSignalRepository;
        this.userRepository = userRepository;
        this.preferencesService = preferencesService;
        this.metrics = metrics;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public EmailOutboxWorker(
            EmailOutboxRepository outboxRepository,
            EmailSender emailSender,
            EmailTemplateService emailTemplateService,
            OtpPayloadCryptoService cryptoService,
            TenSignalRepository tenSignalRepository,
            ApplicationMetrics metrics,
            AuditLogService auditLogService,
            ObjectMapper objectMapper,
            Clock clock
    ) {
        this(outboxRepository, emailSender, emailTemplateService, cryptoService, tenSignalRepository, null, null, metrics, auditLogService, objectMapper, clock);
    }

    @Value("${app.email.outbox.batch-size:20}")
    private int batchSize = 20;

    @Scheduled(fixedDelayString = "${app.email.outbox.worker-interval-ms:5000}")
    public void processOutbox() {
        Instant now = clock.instant();

        // 1. Mark expired items as SKIPPED
        try {
            int skippedCount = outboxRepository.markExpiredAsSkipped(now);
            if (skippedCount > 0) {
                log.info("Skipped {} expired email outbox entries", skippedCount);
                metrics.emailSkipped("ALL", "expired");
            }
        } catch (Exception ex) {
            log.warn("Error marking expired outbox items: {}", ex.getMessage());
        }

        // 2. Claim pending batch using FOR UPDATE SKIP LOCKED
        List<EmailOutboxEntity> batch = claimBatch(now);
        if (batch.isEmpty()) {
            return;
        }

        for (EmailOutboxEntity item : batch) {
            try {
                processSingleItem(item.getId());
            } catch (Exception ex) {
                log.error("Unhandled error processing outbox item {}: {}", item.getId(), ex.getMessage());
            }
        }
    }

    @Transactional
    public List<EmailOutboxEntity> claimBatch(Instant now) {
        int boundedLimit = Math.max(1, Math.min(batchSize, 100));
        return outboxRepository.claimPendingBatch(now, boundedLimit);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processSingleItem(UUID itemId) {
        Optional<EmailOutboxEntity> itemOpt = outboxRepository.findById(itemId);
        if (itemOpt.isEmpty()) {
            return;
        }
        EmailOutboxEntity item = itemOpt.get();
        if (item.getStatus() != EmailOutboxStatus.PENDING) {
            return;
        }
        processItemInternal(item);
    }

    public void processItemInternal(EmailOutboxEntity item) {
        Instant now = clock.instant();

        // Check expiry
        if (item.getExpiresAt() != null && item.getExpiresAt().isBefore(now)) {
            item.setStatus(EmailOutboxStatus.SKIPPED);
            if (NotificationType.ACCOUNT_DELETED.name().equals(item.getNotificationType())) {
                item.setRecipient("purged@deleted.tensignal.app");
                item.setPayloadJson("{}");
            }
            outboxRepository.save(item);
            metrics.emailSkipped(item.getNotificationType(), "expired");
            auditLogService.record(AuditEvent.EMAIL_SKIPPED, "expired", Map.of("type", item.getNotificationType()));
            log.info("Email outbox item {} skipped due to expiration", item.getId());
            return;
        }

        NotificationType type;
        try {
            type = NotificationType.valueOf(item.getNotificationType());
        } catch (IllegalArgumentException ex) {
            log.error("Unknown notification type: {}", item.getNotificationType());
            item.setStatus(EmailOutboxStatus.FAILED);
            outboxRepository.save(item);
            metrics.emailFailed(item.getNotificationType());
            return;
        }

        // Check FIRST_SHARE_REMINDER condition (cancel if responseCount >= 3)
        if (type == NotificationType.FIRST_SHARE_REMINDER) {
            if (shouldCancelFirstShareReminder(item)) {
                item.setStatus(EmailOutboxStatus.SKIPPED);
                outboxRepository.save(item);
                metrics.emailSkipped(type.name(), "threshold_reached");
                auditLogService.record(AuditEvent.EMAIL_SKIPPED, "threshold_reached", Map.of("type", type.name()));
                log.info("First share reminder {} skipped because responseCount >= 3", item.getId());
                return;
            }
        }

        // Delivery-time preference check for non-transactional notifications
        if (!type.isTransactional()) {
            UUID targetUserId = item.getUserId();
            if (targetUserId == null && item.getRecipient() != null && userRepository != null) {
                targetUserId = userRepository.findByEmail(item.getRecipient().trim().toLowerCase(Locale.ROOT))
                    .map(User::getId)
                    .orElse(null);
            }
            if (targetUserId != null && preferencesService != null && !preferencesService.isAllowed(targetUserId, type)) {
                item.setStatus(EmailOutboxStatus.SKIPPED);
                outboxRepository.save(item);
                metrics.emailSkipped(type.name(), "user_preference_revoked");
                auditLogService.record(AuditEvent.EMAIL_SKIPPED, "user_preference_revoked", Map.of("type", type.name()));
                log.info("Email outbox item {} skipped at delivery time: user preference revoked for type={}", item.getId(), type);
                return;
            }
        }

        // Decrypt or parse payload
        Map<String, Object> payload;
        try {
            if (type.isOtp()) {
                payload = cryptoService.decryptPayload(item.getPayloadJson());
            } else {
                payload = objectMapper.readValue(item.getPayloadJson(), new TypeReference<Map<String, Object>>() {});
            }
        } catch (Exception ex) {
            log.error("Failed to parse/decrypt payload for outbox item {}: {}", item.getId(), ex.getMessage());
            item.setStatus(EmailOutboxStatus.FAILED);
            outboxRepository.save(item);
            metrics.emailFailed(type.name());
            return;
        }

        // Render template
        RenderedEmailContent rendered;
        try {
            rendered = emailTemplateService.render(type, item.getLocale(), payload);
        } catch (Exception ex) {
            log.error("Failed to render template for outbox item {}: {}", item.getId(), ex.getMessage());
            item.setStatus(EmailOutboxStatus.FAILED);
            outboxRepository.save(item);
            metrics.emailFailed(type.name());
            return;
        }

        // Build EmailMessage
        String idempotencyKey = item.getIdempotencyKey() != null && !item.getIdempotencyKey().isBlank()
            ? item.getIdempotencyKey()
            : item.getId().toString();

        EmailMessage message = EmailMessage.builder()
            .to(item.getRecipient())
            .subject(rendered.getSubject())
            .htmlBody(rendered.getHtmlBody())
            .textBody(rendered.getTextBody())
            .notificationType(type.name())
            .idempotencyKey(idempotencyKey)
            .build();

        // Send via EmailSender
        EmailSendResult result = emailSender.send(message);

        if (result.isDisabled()) {
            item.setStatus(EmailOutboxStatus.SENT);
            item.setSentAt(now);
            item.setProviderMessageId("provider-disabled");
            outboxRepository.save(item);
            metrics.emailProviderDisabled(type.name());
            auditLogService.record(AuditEvent.EMAIL_PROVIDER_DISABLED, "disabled", Map.of("type", type.name()));
            log.info("Email provider disabled. Marked item {} as completed without delivery", item.getId());
            return;
        }

        if (result.isSuccess()) {
            item.setStatus(EmailOutboxStatus.SENT);
            item.setSentAt(now);
            item.setProviderMessageId(result.getProviderMessageId());

            // PII Purge for ACCOUNT_DELETED
            if (type == NotificationType.ACCOUNT_DELETED) {
                item.setRecipient("purged@deleted.tensignal.app");
                item.setPayloadJson("{}");
            }

            outboxRepository.save(item);
            metrics.emailSent(type.name());
            auditLogService.record(AuditEvent.EMAIL_SENT, "success", Map.of("type", type.name()));
            log.info("Email sent successfully for outbox item {} (type={})", item.getId(), type.name());

        } else {
            // Failure handling
            int newAttempts = item.getAttempts() + 1;
            item.setAttempts(newAttempts);

            boolean isTerminal = !result.isRetryable() || newAttempts >= item.getMaxAttempts();

            if (isTerminal) {
                item.setStatus(EmailOutboxStatus.FAILED);
                if (type == NotificationType.ACCOUNT_DELETED) {
                    item.setRecipient("purged@deleted.tensignal.app");
                    item.setPayloadJson("{}");
                }
                outboxRepository.save(item);
                metrics.emailFailed(type.name());
                auditLogService.record(AuditEvent.EMAIL_DELIVERY_FAILED,
                    !result.isRetryable() ? "permanent_failure" : "max_attempts_reached",
                    Map.of("type", type.name(), "attempts", String.valueOf(newAttempts)));
                log.warn("Email delivery failed permanently for item {} (retryable={}, attempts={}): {}",
                    item.getId(), result.isRetryable(), newAttempts, result.getErrorMessage());
            } else {
                Duration backoff = calculateBackoff(newAttempts);
                item.setNextAttemptAt(now.plus(backoff));
                outboxRepository.save(item);
                metrics.emailRetry(type.name());
                log.warn("Email delivery transient failure for item {}. Scheduling retry #{} after {}",
                    item.getId(), newAttempts, backoff);
            }
        }
    }

    private boolean shouldCancelFirstShareReminder(EmailOutboxEntity item) {
        String key = item.getIdempotencyKey();
        if (key != null && key.startsWith("first-share-reminder:")) {
            try {
                String tenSignalIdStr = key.substring("first-share-reminder:".length());
                UUID tenSignalId = UUID.fromString(tenSignalIdStr);
                return tenSignalRepository.findById(tenSignalId)
                    .map(s -> s.getResponseCount() >= 3)
                    .orElse(false);
            } catch (Exception ex) {
                log.warn("Error parsing tenSignalId for first share reminder check: {}", ex.getMessage());
            }
        }
        return false;
    }

    public static Duration calculateBackoff(int attempt) {
        return switch (attempt) {
            case 1 -> Duration.ofMinutes(1);
            case 2 -> Duration.ofMinutes(5);
            case 3 -> Duration.ofMinutes(15);
            default -> Duration.ofHours(1);
        };
    }
}
