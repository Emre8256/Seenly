package com.seenly.backend.service;

import com.seenly.backend.entity.RateLimitBucket;
import com.seenly.backend.exception.RateLimitExceededException;
import com.seenly.backend.repository.RateLimitBucketRepository;
import com.seenly.backend.observability.ApplicationMetrics;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class RateLimitService {
    private final RateLimitBucketRepository repository;
    private final TokenHashingService hashingService;
    private final Clock clock;
    private final AuditLogService auditLogService;
    private final ApplicationMetrics metrics;

    @Transactional
    public void check(String action, String subject, int limit, Duration window) {
        Instant now = clock.instant();
        String key = hashingService.hashToken("rate:v1:" + action + ":" + subject);
        RateLimitBucket bucket = repository.findByKeyForUpdate(key).orElse(null);
        if (bucket == null) {
            try {
                repository.saveAndFlush(RateLimitBucket.builder()
                    .keyHash(key).action(action).windowStartedAt(now)
                    .expiresAt(now.plus(window)).requestCount(1).build());
            } catch (DataIntegrityViolationException ex) {
                // A concurrent first request won the primary-key race. Fail closed
                // with a controlled response instead of allowing an uncounted call.
                recordTriggered(action);
                throw new RateLimitExceededException(Math.max(1, window.toSeconds()));
            }
            return;
        }
        if (!bucket.getExpiresAt().isAfter(now)) {
            bucket.setWindowStartedAt(now);
            bucket.setExpiresAt(now.plus(window));
            bucket.setRequestCount(1);
            repository.save(bucket);
            return;
        }
        if (bucket.getRequestCount() >= limit) {
            recordTriggered(action);
            throw new RateLimitExceededException(Math.max(1,
                ChronoUnit.SECONDS.between(now, bucket.getExpiresAt())));
        }
        bucket.setRequestCount(bucket.getRequestCount() + 1);
        repository.save(bucket);
    }

    private void recordTriggered(String action) {
        metrics.rateLimitTriggered(action);
        auditLogService.record(AuditEvent.RATE_LIMIT_TRIGGERED, "blocked", java.util.Map.of("policy", action));
    }
}
