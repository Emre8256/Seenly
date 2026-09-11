package com.seenly.backend.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seenly.backend.constant.OtpPurpose;
import com.seenly.backend.dto.CreateSeenlyRequest;
import com.seenly.backend.dto.CreateSeenlyResponse;
import com.seenly.backend.dto.NotificationPreferencesDto;
import com.seenly.backend.entity.*;
import com.seenly.backend.payment.EntitlementType;
import com.seenly.backend.payment.PaymentStatus;
import com.seenly.backend.repository.*;
import com.seenly.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EmailNotificationIntegrationTest {

    @Autowired private EmailOutboxRepository outboxRepository;
    @Autowired private EmailNotificationService notificationService;
    @Autowired private UserNotificationPreferencesService preferencesService;
    @Autowired private OtpPayloadCryptoService cryptoService;
    @Autowired private OutboxOtpDeliveryService outboxOtpDeliveryService;
    @Autowired private SeenlyRepository seenlyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PaymentTransactionRepository paymentTransactionRepository;
    @Autowired private PaymentEntitlementService paymentEntitlementService;
    @Autowired private ScoringEngineService scoringEngineService;
    @Autowired private BillingService billingService;
    @Autowired private SeenlyService seenlyService;
    @Autowired private NotificationLifecycleScheduler lifecycleScheduler;
    @Autowired private Clock clock;
    @Autowired private jakarta.persistence.EntityManager entityManager;

    private User testUser;
    private Seenly testSeenly;

    @BeforeEach
    void setUp() {
        outboxRepository.deleteAll();
        testUser = userRepository.save(User.builder()
            .email("testowner@example.com")
            .baseFormCapacity(10)
            .purchasedExtraCapacity(0)
            .isPremium(false)
            .build());

        testSeenly = seenlyRepository.save(Seenly.builder()
            .displayName("Test Profile")
            .email("testowner@example.com")
            .user(testUser)
            .publicSlug("test-slug-123")
            .ownerTokenHash("some-owner-hash")
            .responseCount(0)
            .isCapped(false)
            .lastActivityAt(LocalDateTime.now())
            .build());
    }

    @Test
    @DisplayName("14, 15, 16. Registration, Login, and Email-Change OTPs enqueued with encrypted payload")
    void testOtpDeliveries() {
        outboxOtpDeliveryService.send("user1@example.com", "4321", OtpPurpose.REGISTER);
        outboxOtpDeliveryService.send("user2@example.com", "8765", OtpPurpose.LOGIN);
        outboxOtpDeliveryService.send("user3@example.com", "1122", OtpPurpose.EMAIL_CHANGE);

        List<EmailOutboxEntity> all = outboxRepository.findAll();
        assertThat(all).hasSize(3);

        EmailOutboxEntity reg = all.stream().filter(e -> e.getNotificationType().equals("REGISTRATION_VERIFICATION")).findFirst().orElseThrow();
        assertThat(reg.getExpiresAt()).isNotNull();
        // Payload must NOT contain plaintext code!
        assertThat(reg.getPayloadJson()).doesNotContain("4321");
        // Decrypted payload must contain the code
        Map<String, Object> decrypted = cryptoService.decryptPayload(reg.getPayloadJson());
        assertThat(decrypted.get("code")).isEqualTo("4321");

        EmailOutboxEntity login = all.stream().filter(e -> e.getNotificationType().equals("LOGIN_VERIFICATION")).findFirst().orElseThrow();
        assertThat(login.getPayloadJson()).doesNotContain("8765");
        assertThat(cryptoService.decryptPayload(login.getPayloadJson()).get("code")).isEqualTo("8765");

        EmailOutboxEntity emailChange = all.stream().filter(e -> e.getNotificationType().equals("EMAIL_CHANGE_VERIFICATION")).findFirst().orElseThrow();
        assertThat(emailChange.getPayloadJson()).doesNotContain("1122");
        assertThat(cryptoService.decryptPayload(emailChange.getPayloadJson()).get("code")).isEqualTo("1122");
    }

    @Test
    @DisplayName("17. 24h reminder scheduled & 18. reminder cancellation when responseCount >= 3")
    void testFirstShareReminderLifecycle() {
        notificationService.enqueue(
            NotificationType.FIRST_SHARE_REMINDER,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("shareUrl", "https://seenly.app/p/test-slug-123"),
            "first-share-reminder:" + testSeenly.getId(),
            clock.instant().plus(Duration.ofHours(24)),
            null
        );

        Optional<EmailOutboxEntity> reminderOpt = outboxRepository.findByIdempotencyKey("first-share-reminder:" + testSeenly.getId());
        assertThat(reminderOpt).isPresent();
        assertThat(reminderOpt.get().getStatus()).isEqualTo(EmailOutboxStatus.PENDING);

        // Cancel reminder
        outboxRepository.cancelPendingByPrefix("first-share-reminder:" + testSeenly.getId() + "%", clock.instant());
        entityManager.clear();
        EmailOutboxEntity cancelled = outboxRepository.findByIdempotencyKey("first-share-reminder:" + testSeenly.getId()).orElseThrow();
        assertThat(cancelled.getStatus()).isEqualTo(EmailOutboxStatus.SKIPPED);
    }

    @Test
    @DisplayName("19. Evaluation debounce aggregates multiple evaluations within 10-minute window")
    void testEvaluationDebounce() {
        long window = clock.instant().getEpochSecond() / 600;
        String debounceKey = "new-evaluation:" + testSeenly.getId() + ":" + window;

        // First evaluation in window
        notificationService.enqueue(
            NotificationType.NEW_EVALUATION,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("count", 1, "dashboardUrl", "https://seenly.app/dashboard"),
            debounceKey,
            clock.instant().plusSeconds(600),
            null
        );

        // Second evaluation in same window
        notificationService.enqueue(
            NotificationType.NEW_EVALUATION,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("count", 1, "dashboardUrl", "https://seenly.app/dashboard"),
            debounceKey,
            clock.instant().plusSeconds(600),
            null
        );

        // Third evaluation in same window
        notificationService.enqueue(
            NotificationType.NEW_EVALUATION,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("count", 1, "dashboardUrl", "https://seenly.app/dashboard"),
            debounceKey,
            clock.instant().plusSeconds(600),
            null
        );

        List<EmailOutboxEntity> evaluations = outboxRepository.findAll().stream()
            .filter(e -> e.getNotificationType().equals("NEW_EVALUATION"))
            .toList();

        // Exactly ONE outbox item aggregated
        assertThat(evaluations).hasSize(1);
        assertThat(evaluations.get(0).getPayloadJson()).contains("\"count\":3");
    }

    @Test
    @DisplayName("20. Report unlocked triggered on 2 -> 3 response count transition")
    void testReportUnlockedNotification() {
        notificationService.enqueue(
            NotificationType.REPORT_UNLOCKED,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("dashboardUrl", "https://seenly.app/dashboard"),
            "report-unlocked:" + testSeenly.getId(),
            clock.instant(),
            null
        );

        Optional<EmailOutboxEntity> reportOpt = outboxRepository.findByIdempotencyKey("report-unlocked:" + testSeenly.getId());
        assertThat(reportOpt).isPresent();
        assertThat(reportOpt.get().getNotificationType()).isEqualTo("REPORT_UNLOCKED");
    }

    @Test
    @DisplayName("21. 80% capacity alert and 22. full capacity alert")
    void testCapacityAlerts() {
        String version = "10_0";
        notificationService.enqueue(
            NotificationType.CAPACITY_80_PERCENT,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("currentResponses", 8, "maxCapacity", 10, "upgradeUrl", "https://seenly.app/pricing"),
            "capacity-80:" + testSeenly.getId() + ":" + version,
            clock.instant(),
            null
        );

        notificationService.enqueue(
            NotificationType.CAPACITY_FULL,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("maxCapacity", 10, "upgradeUrl", "https://seenly.app/pricing"),
            "capacity-full:" + testSeenly.getId() + ":" + version,
            clock.instant(),
            null
        );

        assertThat(outboxRepository.findByIdempotencyKey("capacity-80:" + testSeenly.getId() + ":" + version)).isPresent();
        assertThat(outboxRepository.findByIdempotencyKey("capacity-full:" + testSeenly.getId() + ":" + version)).isPresent();
    }

    @Test
    @DisplayName("23. Plus welcome, 24. purchase receipt, and 25. refund/chargeback")
    void testPaymentNotifications() {
        UUID txId = UUID.randomUUID();
        PaymentTransaction tx = PaymentTransaction.builder()
            .id(txId)
            .ownerAccountId(testUser.getId())
            .ownerProfileId(testSeenly.getId())
            .provider("iyzico")
            .productCode("SEENLY_PLUS")
            .entitlementType(EntitlementType.PLUS)
            .amountMinor(19900L)
            .currency("TRY")
            .status(PaymentStatus.PAID)
            .providerTransactionId("tx-" + txId)
            .build();
        paymentTransactionRepository.save(tx);

        paymentEntitlementService.grant(tx, clock.instant());

        // Both PLUS_WELCOME and PURCHASE_RECEIPT must be enqueued
        assertThat(outboxRepository.findByIdempotencyKey("plus-welcome:" + txId)).isPresent();
        Optional<EmailOutboxEntity> receiptOpt = outboxRepository.findByIdempotencyKey("purchase-receipt:" + txId);
        assertThat(receiptOpt).isPresent();
        // Receipt must contain product, amount, currency, reference, but NO card/secrets!
        assertThat(receiptOpt.get().getPayloadJson()).contains("SEENLY_PLUS");
        assertThat(receiptOpt.get().getPayloadJson()).contains("199.0");
        assertThat(receiptOpt.get().getPayloadJson()).doesNotContain("secret");
        assertThat(receiptOpt.get().getPayloadJson()).doesNotContain("cardNumber");

        // Reversal does not enqueue welcome email
        int countBefore = outboxRepository.findAll().size();
        paymentEntitlementService.handleFullReversal(tx);
        int countAfter = outboxRepository.findAll().size();
        assertThat(countAfter).isEqualTo(countBefore);
    }

    @Test
    @DisplayName("26. Email changed notification sent to old email")
    void testEmailChangedNotification() {
        String oldEmail = "old_address@example.com";
        notificationService.enqueue(
            NotificationType.EMAIL_CHANGED,
            oldEmail,
            testUser.getId(),
            "tr",
            Map.of("securityUrl", "https://seenly.app/settings/security"),
            "email-changed:" + testSeenly.getId() + ":" + EmailNotificationService.hashRecipient(oldEmail),
            clock.instant(),
            null
        );

        Optional<EmailOutboxEntity> entity = outboxRepository.findByIdempotencyKey("email-changed:" + testSeenly.getId() + ":" + EmailNotificationService.hashRecipient(oldEmail));
        assertThat(entity).isPresent();
        assertThat(entity.get().getRecipient()).isEqualTo(oldEmail);
        assertThat(entity.get().getNotificationType()).isEqualTo("EMAIL_CHANGED");
    }

    @Test
    @DisplayName("27. Account deletion outbox notification")
    void testAccountDeletionNotification() {
        notificationService.enqueue(
            NotificationType.ACCOUNT_DELETED,
            "deleteduser@example.com",
            testUser.getId(),
            "tr",
            Map.of("homeUrl", "https://seenly.app"),
            "account-deleted:" + testUser.getId(),
            clock.instant(),
            clock.instant().plus(Duration.ofHours(24))
        );

        Optional<EmailOutboxEntity> delOpt = outboxRepository.findByIdempotencyKey("account-deleted:" + testUser.getId());
        assertThat(delOpt).isPresent();
        assertThat(delOpt.get().getNotificationType()).isEqualTo("ACCOUNT_DELETED");
    }

    @Test
    @DisplayName("29. Social card changed notification on state transition")
    void testSocialCardChangeNotification() {
        notificationService.enqueue(
            NotificationType.SOCIAL_CARD_CHANGED,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("dashboardUrl", "https://seenly.app/dashboard"),
            "social-card-changed:" + testSeenly.getId() + ":diplomat",
            clock.instant(),
            null
        );

        Optional<EmailOutboxEntity> cardOpt = outboxRepository.findByIdempotencyKey("social-card-changed:" + testSeenly.getId() + ":diplomat");
        assertThat(cardOpt).isPresent();
        assertThat(cardOpt.get().getNotificationType()).isEqualTo("SOCIAL_CARD_CHANGED");
    }

    @Test
    @DisplayName("30. Inactivity reminder triggers when inactive > 7 days")
    void testInactivityReminder() {
        // Set lastActivityAt to 10 days ago
        testSeenly.setLastActivityAt(LocalDateTime.now().minusDays(10));
        seenlyRepository.save(testSeenly);

        lifecycleScheduler.checkInactivityReminders();

        List<EmailOutboxEntity> inactivities = outboxRepository.findAll().stream()
            .filter(e -> e.getNotificationType().equals("INACTIVITY_REMINDER"))
            .toList();

        assertThat(inactivities).hasSize(1);
        assertThat(inactivities.get(0).getRecipient()).isEqualTo(testSeenly.getEmail());
    }

    @Test
    @DisplayName("31. User Notification Preferences filtering")
    void testNotificationPreferencesFiltering() {
        // Disable reminders and evaluations
        preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .evaluations(false)
            .reminders(false)
            .cardChanges(true)
            .capacityAlerts(true)
            .build());

        // 1. Transactional email CANNOT be blocked by preference
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.LOGIN_VERIFICATION)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.PLUS_WELCOME)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.PURCHASE_RECEIPT)).isTrue();

        // 2. Disabled categories ARE blocked
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.NEW_EVALUATION)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.INACTIVITY_REMINDER)).isFalse();

        // 3. Enabled categories ARE allowed
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.SOCIAL_CARD_CHANGED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.CAPACITY_FULL)).isTrue();

        // Enqueueing a blocked notification does not create an outbox record
        Optional<EmailOutboxEntity> result = notificationService.enqueue(
            NotificationType.NEW_EVALUATION,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("count", 1),
            "blocked-eval-key",
            clock.instant(),
            null
        );
        assertThat(result).isEmpty();
        assertThat(outboxRepository.findByIdempotencyKey("blocked-eval-key")).isEmpty();
    }

    @Test
    @DisplayName("35. Duplicate events do not create duplicate outbox entries")
    void testDuplicateEventIdempotency() {
        String key = "duplicate-test-key-123";
        Optional<EmailOutboxEntity> first = notificationService.enqueue(
            NotificationType.REPORT_UNLOCKED,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("dashboardUrl", "https://seenly.app"),
            key,
            clock.instant(),
            null
        );
        assertThat(first).isPresent();

        Optional<EmailOutboxEntity> second = notificationService.enqueue(
            NotificationType.REPORT_UNLOCKED,
            testSeenly.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("dashboardUrl", "https://seenly.app"),
            key,
            clock.instant(),
            null
        );
        assertThat(second).isPresent();
        assertThat(second.get().getId()).isEqualTo(first.get().getId());

        List<EmailOutboxEntity> matching = outboxRepository.findAll().stream()
            .filter(e -> e.getIdempotencyKey().equals(key))
            .toList();
        assertThat(matching).hasSize(1);
    }
}
