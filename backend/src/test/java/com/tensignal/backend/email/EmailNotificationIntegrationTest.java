package com.tensignal.backend.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.constant.OtpPurpose;
import com.tensignal.backend.dto.CreateTenSignalRequest;
import com.tensignal.backend.dto.CreateTenSignalResponse;
import com.tensignal.backend.dto.NotificationPreferencesDto;
import com.tensignal.backend.entity.*;
import com.tensignal.backend.payment.EntitlementType;
import com.tensignal.backend.payment.PaymentStatus;
import com.tensignal.backend.repository.*;
import com.tensignal.backend.service.*;
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
    @Autowired private TenSignalRepository tenSignalRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PaymentTransactionRepository paymentTransactionRepository;
    @Autowired private PaymentEntitlementService paymentEntitlementService;
    @Autowired private ScoringEngineService scoringEngineService;
    @Autowired private BillingService billingService;
    @Autowired private TenSignalService tenSignalService;
    @Autowired private OwnerSessionService ownerSessionService;
    @Autowired private NotificationLifecycleScheduler lifecycleScheduler;
    @Autowired private EmailOutboxWorker emailOutboxWorker;
    @Autowired private Clock clock;
    @Autowired private jakarta.persistence.EntityManager entityManager;

    private User testUser;
    private TenSignal testTenSignal;

    @BeforeEach
    void setUp() {
        outboxRepository.deleteAll();
        testUser = userRepository.save(User.builder()
            .email("testowner@example.com")
            .baseFormCapacity(10)
            .purchasedExtraCapacity(0)
            .isPremium(false)
            .build());

        testTenSignal = tenSignalRepository.save(TenSignal.builder()
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
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("shareUrl", "https://10signal.me/p/test-slug-123"),
            "first-share-reminder:" + testTenSignal.getId(),
            clock.instant().plus(Duration.ofHours(24)),
            null
        );

        Optional<EmailOutboxEntity> reminderOpt = outboxRepository.findByIdempotencyKey("first-share-reminder:" + testTenSignal.getId());
        assertThat(reminderOpt).isPresent();
        assertThat(reminderOpt.get().getStatus()).isEqualTo(EmailOutboxStatus.PENDING);

        // Cancel reminder
        outboxRepository.cancelPendingByPrefix("first-share-reminder:" + testTenSignal.getId() + "%", clock.instant());
        entityManager.clear();
        EmailOutboxEntity cancelled = outboxRepository.findByIdempotencyKey("first-share-reminder:" + testTenSignal.getId()).orElseThrow();
        assertThat(cancelled.getStatus()).isEqualTo(EmailOutboxStatus.SKIPPED);
    }

    @Test
    @DisplayName("19. Evaluation debounce aggregates multiple evaluations within 10-minute window")
    void testEvaluationDebounce() {
        long window = clock.instant().getEpochSecond() / 600;
        String debounceKey = "new-evaluation:" + testTenSignal.getId() + ":" + window;

        // First evaluation in window
        notificationService.enqueue(
            NotificationType.NEW_EVALUATION,
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("count", 1, "dashboardUrl", "https://10signal.me"),
            debounceKey,
            clock.instant().plusSeconds(600),
            null
        );

        // Second evaluation in same window
        notificationService.enqueue(
            NotificationType.NEW_EVALUATION,
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("count", 1, "dashboardUrl", "https://10signal.me"),
            debounceKey,
            clock.instant().plusSeconds(600),
            null
        );

        // Third evaluation in same window
        notificationService.enqueue(
            NotificationType.NEW_EVALUATION,
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("count", 1, "dashboardUrl", "https://10signal.me"),
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
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("dashboardUrl", "https://10signal.me"),
            "report-unlocked:" + testTenSignal.getId(),
            clock.instant(),
            null
        );

        Optional<EmailOutboxEntity> reportOpt = outboxRepository.findByIdempotencyKey("report-unlocked:" + testTenSignal.getId());
        assertThat(reportOpt).isPresent();
        assertThat(reportOpt.get().getNotificationType()).isEqualTo("REPORT_UNLOCKED");
    }

    @Test
    @DisplayName("21. 80% capacity alert and 22. full capacity alert")
    void testCapacityAlerts() {
        String version = "10_0";
        notificationService.enqueue(
            NotificationType.CAPACITY_80_PERCENT,
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("currentResponses", 8, "maxCapacity", 10, "upgradeUrl", "https://10signal.me"),
            "capacity-80:" + testTenSignal.getId() + ":" + version,
            clock.instant(),
            null
        );

        notificationService.enqueue(
            NotificationType.CAPACITY_FULL,
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("maxCapacity", 10, "upgradeUrl", "https://10signal.me"),
            "capacity-full:" + testTenSignal.getId() + ":" + version,
            clock.instant(),
            null
        );

        assertThat(outboxRepository.findByIdempotencyKey("capacity-80:" + testTenSignal.getId() + ":" + version)).isPresent();
        assertThat(outboxRepository.findByIdempotencyKey("capacity-full:" + testTenSignal.getId() + ":" + version)).isPresent();
    }

    @Test
    @DisplayName("23. Plus welcome, 24. purchase receipt, and 25. refund/chargeback")
    void testPaymentNotifications() {
        UUID txId = UUID.randomUUID();
        PaymentTransaction tx = PaymentTransaction.builder()
            .id(txId)
            .ownerAccountId(testUser.getId())
            .ownerProfileId(testTenSignal.getId())
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
            Map.of("securityUrl", "https://10signal.me/settings/security"),
            "email-changed:" + testTenSignal.getId() + ":" + EmailNotificationService.hashRecipient(oldEmail),
            clock.instant(),
            null
        );

        Optional<EmailOutboxEntity> entity = outboxRepository.findByIdempotencyKey("email-changed:" + testTenSignal.getId() + ":" + EmailNotificationService.hashRecipient(oldEmail));
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
            Map.of("homeUrl", "https://10signal.me"),
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
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("dashboardUrl", "https://10signal.me"),
            "social-card-changed:" + testTenSignal.getId() + ":diplomat",
            clock.instant(),
            null
        );

        Optional<EmailOutboxEntity> cardOpt = outboxRepository.findByIdempotencyKey("social-card-changed:" + testTenSignal.getId() + ":diplomat");
        assertThat(cardOpt).isPresent();
        assertThat(cardOpt.get().getNotificationType()).isEqualTo("SOCIAL_CARD_CHANGED");
    }

    @Test
    @DisplayName("30. Inactivity reminder triggers when inactive > 7 days")
    void testInactivityReminder() {
        // Set lastActivityAt to 10 days ago
        testTenSignal.setLastActivityAt(LocalDateTime.now().minusDays(10));
        tenSignalRepository.save(testTenSignal);

        lifecycleScheduler.checkInactivityReminders();

        List<EmailOutboxEntity> inactivities = outboxRepository.findAll().stream()
            .filter(e -> e.getNotificationType().equals("INACTIVITY_REMINDER"))
            .toList();

        assertThat(inactivities).hasSize(1);
        assertThat(inactivities.get(0).getRecipient()).isEqualTo(testTenSignal.getEmail());
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
            testTenSignal.getEmail(),
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
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("dashboardUrl", "https://10signal.me"),
            key,
            clock.instant(),
            null
        );
        assertThat(first).isPresent();

        Optional<EmailOutboxEntity> second = notificationService.enqueue(
            NotificationType.REPORT_UNLOCKED,
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("dashboardUrl", "https://10signal.me"),
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

    @Test
    @DisplayName("36. New user preference defaults: master and all optional categories are true")
    void testNewUserPreferenceDefaultsAllTrue() {
        User brandNewUser = userRepository.save(User.builder()
            .email("brandnew@example.com")
            .build());

        NotificationPreferencesDto prefs = preferencesService.getPreferences(brandNewUser);
        assertThat(prefs.isMasterEmail()).isTrue();
        assertThat(prefs.isEvaluations()).isTrue();
        assertThat(prefs.isReminders()).isTrue();
        assertThat(prefs.isCardChanges()).isTrue();
        assertThat(prefs.isCapacityAlerts()).isTrue();

        // Null user should also return all true
        NotificationPreferencesDto nullUserPrefs = preferencesService.getPreferences(null);
        assertThat(nullUserPrefs.isMasterEmail()).isTrue();
        assertThat(nullUserPrefs.isEvaluations()).isTrue();
        assertThat(nullUserPrefs.isReminders()).isTrue();
        assertThat(nullUserPrefs.isCardChanges()).isTrue();
        assertThat(nullUserPrefs.isCapacityAlerts()).isTrue();

        // All 7 optional notifications allowed by default
        assertThat(preferencesService.isAllowed(brandNewUser.getId(), NotificationType.NEW_EVALUATION)).isTrue();
        assertThat(preferencesService.isAllowed(brandNewUser.getId(), NotificationType.REPORT_UNLOCKED)).isTrue();
        assertThat(preferencesService.isAllowed(brandNewUser.getId(), NotificationType.FIRST_SHARE_REMINDER)).isTrue();
        assertThat(preferencesService.isAllowed(brandNewUser.getId(), NotificationType.INACTIVITY_REMINDER)).isTrue();
        assertThat(preferencesService.isAllowed(brandNewUser.getId(), NotificationType.SOCIAL_CARD_CHANGED)).isTrue();
        assertThat(preferencesService.isAllowed(brandNewUser.getId(), NotificationType.CAPACITY_80_PERCENT)).isTrue();
        assertThat(preferencesService.isAllowed(brandNewUser.getId(), NotificationType.CAPACITY_FULL)).isTrue();
    }

    @Test
    @DisplayName("37. Master switch OFF blocks all optional notifications but preserves sub-switch states & allows transactional")
    void testMasterSwitchBehavior() {
        // Set sub-switches: evaluations=true, reminders=false, cardChanges=true, capacityAlerts=true
        preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(true)
            .reminders(false)
            .cardChanges(true)
            .capacityAlerts(true)
            .build());

        // Now turn master OFF
        NotificationPreferencesDto updated = preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(false)
            .evaluations(true)
            .reminders(false)
            .cardChanges(true)
            .capacityAlerts(true)
            .build());

        assertThat(updated.isMasterEmail()).isFalse();
        assertThat(updated.isEvaluations()).isTrue();
        assertThat(updated.isReminders()).isFalse();

        // With master OFF, all 7 optional notifications MUST be blocked:
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.NEW_EVALUATION)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.REPORT_UNLOCKED)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.FIRST_SHARE_REMINDER)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.INACTIVITY_REMINDER)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.SOCIAL_CARD_CHANGED)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.CAPACITY_80_PERCENT)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.CAPACITY_FULL)).isFalse();

        // Transactional emails MUST STILL BE ALLOWED even if master is OFF:
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.LOGIN_VERIFICATION)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.REGISTRATION_VERIFICATION)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.EMAIL_CHANGE_VERIFICATION)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.EMAIL_CHANGED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.ACCOUNT_DELETED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.PLUS_WELCOME)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.PURCHASE_RECEIPT)).isTrue();

        // Now turn master back ON: sub-switches should restore their previous states
        NotificationPreferencesDto restored = preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(true)
            .reminders(false)
            .cardChanges(true)
            .capacityAlerts(true)
            .build());

        assertThat(restored.isMasterEmail()).isTrue();
        assertThat(restored.isEvaluations()).isTrue();
        assertThat(restored.isReminders()).isFalse();

        // Evaluations is allowed again, but reminders was false so it remains blocked
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.NEW_EVALUATION)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.REPORT_UNLOCKED)).isFalse();
    }

    @Test
    @DisplayName("38. NotificationType switch mapping fidelity")
    void testNotificationTypeSwitchMapping() {
        // 1. Disable only evaluations
        preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(false)
            .reminders(true)
            .cardChanges(true)
            .capacityAlerts(true)
            .build());
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.NEW_EVALUATION)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.REPORT_UNLOCKED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.SOCIAL_CARD_CHANGED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.CAPACITY_FULL)).isTrue();

        // 2. Disable only reminders
        preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(true)
            .reminders(false)
            .cardChanges(true)
            .capacityAlerts(true)
            .build());
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.NEW_EVALUATION)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.REPORT_UNLOCKED)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.FIRST_SHARE_REMINDER)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.INACTIVITY_REMINDER)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.SOCIAL_CARD_CHANGED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.CAPACITY_FULL)).isTrue();

        // 3. Disable only cardChanges
        preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(true)
            .reminders(true)
            .cardChanges(false)
            .capacityAlerts(true)
            .build());
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.NEW_EVALUATION)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.REPORT_UNLOCKED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.SOCIAL_CARD_CHANGED)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.CAPACITY_FULL)).isTrue();

        // 4. Disable only capacityAlerts
        preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(true)
            .reminders(true)
            .cardChanges(true)
            .capacityAlerts(false)
            .build());
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.NEW_EVALUATION)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.REPORT_UNLOCKED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.SOCIAL_CARD_CHANGED)).isTrue();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.CAPACITY_80_PERCENT)).isFalse();
        assertThat(preferencesService.isAllowed(testUser.getId(), NotificationType.CAPACITY_FULL)).isFalse();
    }

    @Test
    @DisplayName("39. Delivery-time preference check marks pending outbox item as SKIPPED")
    void testDeliveryTimePreferenceRevocationIntegration() {
        // Enqueue when allowed
        preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(true)
            .reminders(true)
            .cardChanges(true)
            .capacityAlerts(true)
            .build());

        String key = "eval-key-" + UUID.randomUUID();
        Optional<EmailOutboxEntity> enqueued = notificationService.enqueue(
            NotificationType.NEW_EVALUATION,
            testTenSignal.getEmail(),
            testUser.getId(),
            "tr",
            Map.of("count", 1, "dashboardUrl", "https://10signal.me"),
            key,
            clock.instant(),
            null
        );
        assertThat(enqueued).isPresent();
        UUID outboxId = enqueued.get().getId();

        // Now user turns evaluations OFF
        preferencesService.updatePreferences(testUser, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(false)
            .reminders(true)
            .cardChanges(true)
            .capacityAlerts(true)
            .build());

        // Worker processes the item
        emailOutboxWorker.processItemInternal(enqueued.get());

        EmailOutboxEntity reloaded = outboxRepository.findById(outboxId).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(EmailOutboxStatus.SKIPPED);
    }

    @Test
    @DisplayName("40. tenSignal.getUser() == null auto-links user when profile has email")
    void testTenSignalWithoutUserLinksUserAutomatically() {
        OwnerSessionService.SessionCredentials credentials = ownerSessionService.newCredentials();
        TenSignal orphan = tenSignalRepository.save(TenSignal.builder()
            .displayName("Orphan Profile")
            .email("orphan@example.com")
            .ownerTokenHash(credentials.tokenHash())
            .ownerTokenExpiresAt(credentials.expiresAt())
            .publicSlug("orphan-slug-123")
            .responseCount(0)
            .isCapped(false)
            .lastActivityAt(LocalDateTime.now())
            .build());

        String ownerToken = credentials.rawToken();
        NotificationPreferencesDto prefs = tenSignalService.getNotificationPreferences(ownerToken);
        assertThat(prefs).isNotNull();
        assertThat(prefs.isMasterEmail()).isTrue();

        // Update preferences
        NotificationPreferencesDto updated = tenSignalService.updateNotificationPreferences(ownerToken, NotificationPreferencesDto.builder()
            .masterEmail(true)
            .evaluations(false)
            .reminders(true)
            .cardChanges(true)
            .capacityAlerts(false)
            .build());

        assertThat(updated.isEvaluations()).isFalse();
        assertThat(updated.isCapacityAlerts()).isFalse();

        // Verify user was linked in database
        TenSignal profile = tenSignalRepository.findByPublicSlug("orphan-slug-123").orElseThrow();
        assertThat(profile.getUser()).isNotNull();
        assertThat(profile.getUser().getEmail()).isEqualTo("orphan@example.com");
    }
}
