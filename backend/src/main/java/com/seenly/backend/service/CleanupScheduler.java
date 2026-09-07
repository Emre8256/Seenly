package com.seenly.backend.service;

import com.seenly.backend.observability.ApplicationMetrics;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class CleanupScheduler {
    private final CleanupBatchService cleanup;
    private final ApplicationMetrics metrics;
    private final AuditLogService auditLogService;
    private final Clock clock;

    @Value("${app.cleanup.batch-size:500}")
    private int batchSize;
    @Value("${app.cleanup.retention:PT24H}")
    private Duration retention;

    @Scheduled(fixedDelayString = "${app.cleanup.interval-ms:3600000}")
    public void run() {
        runOne("rate_limit", () -> cleanup.expiredRateLimits(cutoff(), boundedBatchSize()));
        runOne("otp", () -> cleanup.expiredOtps(cutoff(), boundedBatchSize()));
        runOne("grant", () -> cleanup.expiredGrants(cutoff(), boundedBatchSize()));
    }

    private void runOne(String type, CleanupOperation operation) {
        try {
            int deleted = operation.run();
            metrics.cleanup(type, "success");
            if (deleted > 0) log.info("cleanup_batch_completed type={} deletedCount={}", type, deleted);
        } catch (RuntimeException ex) {
            metrics.cleanup(type, "failure");
            auditLogService.record(AuditEvent.CLEANUP_FAILED, "failure", java.util.Map.of("reason", type));
            log.warn("cleanup_batch_failed type={} exceptionType={}", type, ex.getClass().getSimpleName());
        }
    }

    private java.time.Instant cutoff() { return clock.instant().minus(retention); }
    private int boundedBatchSize() { return Math.max(1, Math.min(batchSize, 5_000)); }

    @FunctionalInterface
    private interface CleanupOperation { int run(); }
}
