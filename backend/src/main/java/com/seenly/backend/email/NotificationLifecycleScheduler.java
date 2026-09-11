package com.seenly.backend.email;

import com.seenly.backend.entity.Seenly;
import com.seenly.backend.repository.EmailOutboxRepository;
import com.seenly.backend.repository.SeenlyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationLifecycleScheduler {

    private final SeenlyRepository seenlyRepository;
    private final EmailOutboxRepository outboxRepository;
    private final EmailNotificationService emailNotificationService;
    private final Clock clock;

    @Value("${app.email.lifecycle.inactivity-days:7}")
    private int inactivityDays;

    @Value("${app.email.lifecycle.cooldown-days:30}")
    private int cooldownDays;

    @Scheduled(fixedDelayString = "${app.email.lifecycle.check-interval-ms:3600000}")
    @Transactional
    public void checkInactivityReminders() {
        Instant now = clock.instant();
        LocalDateTime threshold = LocalDateTime.ofInstant(now.minus(Duration.ofDays(inactivityDays)), ZoneOffset.UTC);

        List<Seenly> inactiveSeenlys = seenlyRepository.findAll().stream()
            .filter(s -> s.getEmail() != null && !s.getEmail().isBlank())
            .filter(s -> s.getLastActivityAt() != null && s.getLastActivityAt().isBefore(threshold))
            .toList();

        for (Seenly seenly : inactiveSeenlys) {
            String recipientHash = EmailNotificationService.hashRecipient(seenly.getEmail().trim().toLowerCase());
            Instant cooldownThreshold = now.minus(Duration.ofDays(cooldownDays));

            boolean recentReminderExists = outboxRepository.existsByRecipientHashAndNotificationTypeAndCreatedAtAfter(
                recipientHash, NotificationType.INACTIVITY_REMINDER.name(), cooldownThreshold
            );

            if (!recentReminderExists) {
                long cycle = now.getEpochSecond() / (cooldownDays * 86400L);
                String idempotencyKey = "inactivity-reminder:" + seenly.getId() + ":" + cycle;
                UUID userId = seenly.getUser() != null ? seenly.getUser().getId() : null;

                emailNotificationService.enqueue(
                    NotificationType.INACTIVITY_REMINDER,
                    seenly.getEmail(),
                    userId,
                    "tr",
                    Map.of("dashboardUrl", "https://seenly.app/dashboard"),
                    idempotencyKey,
                    now,
                    null
                );
                log.info("Enqueued inactivity reminder for seenlyId={}", seenly.getId());
            }
        }
    }
}
