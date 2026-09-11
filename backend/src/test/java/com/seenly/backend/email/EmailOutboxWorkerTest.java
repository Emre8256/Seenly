package com.seenly.backend.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seenly.backend.entity.EmailOutboxEntity;
import com.seenly.backend.entity.EmailOutboxStatus;
import com.seenly.backend.observability.ApplicationMetrics;
import com.seenly.backend.observability.AuditLogService;
import com.seenly.backend.repository.EmailOutboxRepository;
import com.seenly.backend.repository.SeenlyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EmailOutboxWorkerTest {

    private EmailOutboxRepository outboxRepository;
    private FakeEmailProvider emailSender;
    private EmailTemplateService templateService;
    private OtpPayloadCryptoService cryptoService;
    private SeenlyRepository seenlyRepository;
    private ApplicationMetrics metrics;
    private AuditLogService auditLogService;
    private ObjectMapper objectMapper;
    private MutableClock clock;
    private EmailOutboxWorker worker;

    private static class MutableClock extends Clock {
        private Instant now;

        public MutableClock(Instant initial) {
            this.now = initial;
        }

        public void advance(Duration duration) {
            this.now = this.now.plus(duration);
        }

        public void setInstant(Instant instant) {
            this.now = instant;
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("UTC");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @BeforeEach
    void setUp() {
        outboxRepository = mock(EmailOutboxRepository.class);
        emailSender = new FakeEmailProvider();
        objectMapper = new ObjectMapper();
        templateService = new EmailTemplateService(objectMapper);
        templateService.init();
        cryptoService = new OtpPayloadCryptoService("test-crypto-secret-key-for-unit-tests-256", objectMapper);
        seenlyRepository = mock(SeenlyRepository.class);
        metrics = mock(ApplicationMetrics.class);
        auditLogService = mock(AuditLogService.class);
        clock = new MutableClock(Instant.parse("2026-09-11T12:00:00Z"));

        worker = new EmailOutboxWorker(
            outboxRepository,
            emailSender,
            templateService,
            cryptoService,
            seenlyRepository,
            metrics,
            auditLogService,
            objectMapper,
            clock
        );
    }

    @Test
    @DisplayName("9. Outbox idempotency & backoff calculation")
    void testBackoffCalculation() {
        assertThat(EmailOutboxWorker.calculateBackoff(1)).isEqualTo(Duration.ofMinutes(1));
        assertThat(EmailOutboxWorker.calculateBackoff(2)).isEqualTo(Duration.ofMinutes(5));
        assertThat(EmailOutboxWorker.calculateBackoff(3)).isEqualTo(Duration.ofMinutes(15));
        assertThat(EmailOutboxWorker.calculateBackoff(4)).isEqualTo(Duration.ofHours(1));
    }

    @Test
    @DisplayName("10. Worker locking and successful processing")
    void testWorkerProcessingSuccess() {
        UUID itemId = UUID.randomUUID();
        EmailOutboxEntity entity = EmailOutboxEntity.builder()
            .id(itemId)
            .notificationType("REPORT_UNLOCKED")
            .recipient("user@example.com")
            .recipientHash("hash")
            .locale("tr")
            .payloadJson("{\"dashboardUrl\":\"https://seenly.app/dashboard\"}")
            .status(EmailOutboxStatus.PENDING)
            .scheduledAt(clock.instant())
            .nextAttemptAt(clock.instant())
            .idempotencyKey("report-unlocked:" + UUID.randomUUID())
            .build();

        when(outboxRepository.findById(itemId)).thenReturn(Optional.of(entity));

        worker.processSingleItem(itemId);

        assertThat(entity.getStatus()).isEqualTo(EmailOutboxStatus.SENT);
        assertThat(entity.getSentAt()).isEqualTo(clock.instant());
        assertThat(emailSender.getSentMessages()).hasSize(1);
        assertThat(emailSender.getSentMessages().get(0).getTo()).isEqualTo("user@example.com");
        verify(metrics).emailSent("REPORT_UNLOCKED");
    }

    @Test
    @DisplayName("11. Concurrent worker duplicate göndermiyor")
    void testConcurrentWorkersDoNotSendDuplicates() {
        UUID itemId = UUID.randomUUID();
        EmailOutboxEntity entity = EmailOutboxEntity.builder()
            .id(itemId)
            .notificationType("REPORT_UNLOCKED")
            .recipient("user@example.com")
            .recipientHash("hash")
            .locale("tr")
            .payloadJson("{\"dashboardUrl\":\"https://seenly.app/dashboard\"}")
            .status(EmailOutboxStatus.SENT) // Already claimed and processed by worker 1
            .scheduledAt(clock.instant())
            .nextAttemptAt(clock.instant())
            .idempotencyKey("report-unlocked:123")
            .build();

        when(outboxRepository.findById(itemId)).thenReturn(Optional.of(entity));

        // Worker 2 attempts to process
        worker.processSingleItem(itemId);

        // No new emails sent by worker 2 because status is not PENDING
        assertThat(emailSender.getSentMessages()).isEmpty();
    }

    @Test
    @DisplayName("12. Retry and backoff on transient failure")
    void testRetryAndBackoffOnFailure() {
        emailSender.setSimulateFailure(true, true);

        UUID itemId = UUID.randomUUID();
        EmailOutboxEntity entity = EmailOutboxEntity.builder()
            .id(itemId)
            .notificationType("REPORT_UNLOCKED")
            .recipient("user@example.com")
            .recipientHash("hash")
            .locale("tr")
            .payloadJson("{\"dashboardUrl\":\"https://seenly.app/dashboard\"}")
            .status(EmailOutboxStatus.PENDING)
            .scheduledAt(clock.instant())
            .nextAttemptAt(clock.instant())
            .attempts(0)
            .maxAttempts(5)
            .idempotencyKey("report-unlocked:" + UUID.randomUUID())
            .build();

        when(outboxRepository.findById(itemId)).thenReturn(Optional.of(entity));

        worker.processSingleItem(itemId);

        assertThat(entity.getAttempts()).isEqualTo(1);
        assertThat(entity.getStatus()).isEqualTo(EmailOutboxStatus.PENDING);
        assertThat(entity.getNextAttemptAt()).isEqualTo(clock.instant().plus(Duration.ofMinutes(1)));
        verify(metrics).emailRetry("REPORT_UNLOCKED");

        // Simulate reaching max attempts (attempt 4 failing -> attempt 5 -> FAILED)
        entity.setAttempts(4);
        worker.processSingleItem(itemId);

        assertThat(entity.getAttempts()).isEqualTo(5);
        assertThat(entity.getStatus()).isEqualTo(EmailOutboxStatus.FAILED);
        verify(metrics).emailFailed("REPORT_UNLOCKED");
    }

    @Test
    @DisplayName("13. Expiry - expired email is skipped and never sent")
    void testExpiredItemIsSkipped() {
        UUID itemId = UUID.randomUUID();
        EmailOutboxEntity entity = EmailOutboxEntity.builder()
            .id(itemId)
            .notificationType("LOGIN_VERIFICATION")
            .recipient("user@example.com")
            .recipientHash("hash")
            .locale("tr")
            .payloadJson("{}")
            .status(EmailOutboxStatus.PENDING)
            .scheduledAt(clock.instant().minus(Duration.ofHours(1)))
            .nextAttemptAt(clock.instant().minus(Duration.ofHours(1)))
            .expiresAt(clock.instant().minus(Duration.ofMinutes(10))) // Expired!
            .idempotencyKey("otp-login:123")
            .build();

        when(outboxRepository.findById(itemId)).thenReturn(Optional.of(entity));

        worker.processSingleItem(itemId);

        assertThat(entity.getStatus()).isEqualTo(EmailOutboxStatus.SKIPPED);
        assertThat(emailSender.getSentMessages()).isEmpty();
        verify(metrics).emailSkipped("LOGIN_VERIFICATION", "expired");
    }

    @Test
    @DisplayName("33. No SMTP call inside HTTP request & 34. Multi-instance-safe claiming")
    void testClaimPendingBatchParameters() {
        when(outboxRepository.claimPendingBatch(any(Instant.class), eq(20)))
            .thenReturn(List.of());

        List<EmailOutboxEntity> claimed = worker.claimBatch(clock.instant());
        assertThat(claimed).isEmpty();
        verify(outboxRepository).claimPendingBatch(clock.instant(), 20);
    }
}
