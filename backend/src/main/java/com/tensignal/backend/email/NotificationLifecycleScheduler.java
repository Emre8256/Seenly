package com.tensignal.backend.email;

import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.repository.EmailOutboxRepository;
import com.tensignal.backend.repository.TenSignalRepository;
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

    private final TenSignalRepository tenSignalRepository;
    private final EmailOutboxRepository outboxRepository;
    private final EmailNotificationService emailNotificationService;
    private final com.tensignal.backend.repository.UserRepository userRepository;
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

        List<TenSignal> inactiveTenSignals = tenSignalRepository.findAll().stream()
            .filter(s -> s.getEmail() != null && !s.getEmail().isBlank())
            .filter(s -> s.getLastActivityAt() != null && s.getLastActivityAt().isBefore(threshold))
            .toList();

        for (TenSignal tenSignal : inactiveTenSignals) {
            String recipientHash = EmailNotificationService.hashRecipient(tenSignal.getEmail().trim().toLowerCase());
            Instant cooldownThreshold = now.minus(Duration.ofDays(cooldownDays));

            boolean recentReminderExists = outboxRepository.existsByRecipientHashAndNotificationTypeAndCreatedAtAfter(
                recipientHash, NotificationType.INACTIVITY_REMINDER.name(), cooldownThreshold
            );

            if (!recentReminderExists) {
                long cycle = now.getEpochSecond() / (cooldownDays * 86400L);
                String idempotencyKey = "inactivity-reminder:" + tenSignal.getId() + ":" + cycle;
                UUID userId = tenSignal.getUser() != null
                    ? tenSignal.getUser().getId()
                    : (tenSignal.getEmail() != null ? userRepository.findByEmail(tenSignal.getEmail().trim().toLowerCase(java.util.Locale.ROOT)).map(com.tensignal.backend.entity.User::getId).orElse(null) : null);

                String reminderLocale = tenSignal.getPreferredLocale() != null ? tenSignal.getPreferredLocale() : "en";
                emailNotificationService.enqueue(
                    NotificationType.INACTIVITY_REMINDER,
                    tenSignal.getEmail(),
                    userId,
                    reminderLocale,
                    Map.of("dashboardUrl", "https://10signal.me"),
                    idempotencyKey,
                    now,
                    null
                );
                log.info("Enqueued inactivity reminder for tenSignalId={}", tenSignal.getId());
            }
        }
    }
}
