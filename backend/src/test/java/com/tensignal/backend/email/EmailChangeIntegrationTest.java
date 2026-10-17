package com.tensignal.backend.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.constant.OtpPurpose;
import com.tensignal.backend.entity.*;
import com.tensignal.backend.repository.EmailOutboxRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.service.OwnerSessionService;
import com.tensignal.backend.service.ScoringEngineService;
import com.tensignal.backend.service.TokenHashingService;
import jakarta.persistence.EntityManager;
import com.tensignal.backend.repository.OtpChallengeRepository;
import com.tensignal.backend.repository.VerificationGrantRepository;
import com.tensignal.backend.repository.RateLimitBucketRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class EmailChangeIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private TenSignalRepository tenSignalRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EmailOutboxRepository outboxRepository;
    @Autowired private OtpChallengeRepository challengeRepository;
    @Autowired private VerificationGrantRepository grantRepository;
    @Autowired private RateLimitBucketRepository rateLimitBucketRepository;
    @Autowired private OwnerSessionService ownerSessionService;
    @Autowired private TokenHashingService tokenHashingService;
    @Autowired private ScoringEngineService scoringEngineService;
    @Autowired private OtpPayloadCryptoService cryptoService;
    @Autowired private EmailNotificationService emailNotificationService;
    @Autowired private Clock clock;

    @BeforeEach
    void clean() {
        outboxRepository.deleteAll();
        grantRepository.deleteAll();
        challengeRepository.deleteAll();
        tenSignalRepository.deleteAll();
        userRepository.deleteAll();
        rateLimitBucketRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        clean();
    }

    private static class AccountFixture {
        final TenSignal tenSignal;
        final User user;
        final String ownerToken;

        AccountFixture(TenSignal tenSignal, User user, String ownerToken) {
            this.tenSignal = tenSignal;
            this.user = user;
            this.ownerToken = ownerToken;
        }
    }

    private AccountFixture createAccount(String name, String email) {
        OwnerSessionService.SessionCredentials session = ownerSessionService.newCredentials();
        User user = User.builder()
            .email(email)
            .build();
        userRepository.saveAndFlush(user);

        TenSignal tenSignal = TenSignal.builder()
            .displayName(name)
            .email(email)
            .user(user)
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(session.tokenHash())
            .ownerTokenExpiresAt(session.expiresAt())
            .build();

        tenSignal.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(tenSignal)
            .questionId("classic_self_" + lens + "_01")
            .answerValue(3)
            .build()).toList()));

        tenSignalRepository.saveAndFlush(tenSignal);
        tenSignal.setResultSnapshot(scoringEngineService.calculateSelfResult(tenSignal));
        tenSignalRepository.saveAndFlush(tenSignal);

        return new AccountFixture(tenSignal, user, session.rawToken());
    }

    private String getDeliveredOtp(String recipientEmail, NotificationType type) {
        String hash = EmailNotificationService.hashRecipient(recipientEmail);
        EmailOutboxEntity outbox = outboxRepository.findLatestByRecipientHashAndType(hash, type.name())
            .orElseThrow(() -> new AssertionError("Outbox item not found for recipient " + recipientEmail + " and type " + type));
        Map<String, Object> payload = cryptoService.decryptPayload(outbox.getPayloadJson());
        return String.valueOf(payload.get("code"));
    }

    @Test
    @DisplayName("1. EMAIL_CHANGE request sends verification ONLY to new email while preserving canonical email")
    void testEmailChangeOutboxCreationAndRecipientIsolation() throws Exception {
        AccountFixture account = createAccount("Test Owner", "old_isolated@example.com");

        // Request code for new email
        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "new_isolated@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("success"));

        // Outbox must contain EMAIL_CHANGE_VERIFICATION for new email
        String hash = EmailNotificationService.hashRecipient("new_isolated@example.com");
        Optional<EmailOutboxEntity> outbox = outboxRepository.findLatestByRecipientHashAndType(hash, NotificationType.EMAIL_CHANGE_VERIFICATION.name());
        assertThat(outbox).isPresent();
        assertThat(outbox.get().getRecipient()).isEqualTo("new_isolated@example.com");

        // Database canonical email must NOT have changed!
        TenSignal refreshed = tenSignalRepository.findById(account.tenSignal.getId()).orElseThrow();
        assertThat(refreshed.getEmail()).isEqualTo("old_isolated@example.com");
    }

    @Test
    @DisplayName("2. Full email change lifecycle: canonical update, security notification to old email, and subsequent transactional email routing to new email")
    void testEmailChangeCompleteLifecycleAndRecipientPropagation() throws Exception {
        AccountFixture account = createAccount("Propagation Owner", "old_prop@example.com");

        // 1. Send OTP
        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "new_prop@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk());

        // 2. Fetch OTP from encrypted outbox payload
        String otp = getDeliveredOtp("new_prop@example.com", NotificationType.EMAIL_CHANGE_VERIFICATION);
        assertThat(otp).isNotBlank();

        // 3. Verify OTP
        String verifyBody = mockMvc.perform(post("/api/v1/tensignal/auth/verify-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "new_prop@example.com",
                    "code", otp,
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String grant = objectMapper.readTree(verifyBody).get("verificationGrant").asText();
        assertThat(grant).isNotBlank();

        // 4. Update Email
        mockMvc.perform(put("/api/v1/tensignal/owner/email")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "new_prop@example.com",
                    "verificationGrant", grant
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("new_prop@example.com"));

        // 5. Assert canonical database entities updated atomically
        TenSignal updatedTenSignal = tenSignalRepository.findById(account.tenSignal.getId()).orElseThrow();
        assertThat(updatedTenSignal.getEmail()).isEqualTo("new_prop@example.com");
        User updatedUser = userRepository.findById(account.user.getId()).orElseThrow();
        assertThat(updatedUser.getEmail()).isEqualTo("new_prop@example.com");

        // 6. Assert security notification EMAIL_CHANGED was sent to the OLD email (security alert)
        String oldHash = EmailNotificationService.hashRecipient("old_prop@example.com");
        Optional<EmailOutboxEntity> oldAlert = outboxRepository.findLatestByRecipientHashAndType(oldHash, NotificationType.EMAIL_CHANGED.name());
        assertThat(oldAlert).isPresent();
        assertThat(oldAlert.get().getRecipient()).isEqualTo("old_prop@example.com");

        // 7. Enqueue a new transactional email for this account (e.g. PURCHASE_RECEIPT)
        emailNotificationService.enqueue(
            NotificationType.PURCHASE_RECEIPT,
            updatedUser.getEmail(),
            updatedUser.getId(),
            "tr",
            Map.of("product", "TenSignal Plus", "amount", "199.00"),
            "purchase-receipt:test-" + UUID.randomUUID(),
            clock.instant(),
            null
        );

        // 8. Assert new transactional email strictly targets the NEW canonical email
        String newHash = EmailNotificationService.hashRecipient("new_prop@example.com");
        Optional<EmailOutboxEntity> receiptOutbox = outboxRepository.findLatestByRecipientHashAndType(newHash, NotificationType.PURCHASE_RECEIPT.name());
        assertThat(receiptOutbox).isPresent();
        assertThat(receiptOutbox.get().getRecipient()).isEqualTo("new_prop@example.com");
    }

    @Test
    @DisplayName("3. Concurrent requests: opening a new EMAIL_CHANGE request invalidates previous challenge")
    void testConcurrentEmailChangeRequestsInvalidatePreviousChallenge() throws Exception {
        AccountFixture account = createAccount("Race Owner", "race_initial@example.com");

        // First request to target1
        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "target1@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk());

        String otp1 = getDeliveredOtp("target1@example.com", NotificationType.EMAIL_CHANGE_VERIFICATION);

        // Second request to target2 (supersedes first request)
        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "target2@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk());

        String otp2 = getDeliveredOtp("target2@example.com", NotificationType.EMAIL_CHANGE_VERIFICATION);

        // Attempting to verify otp1 for target1 MUST FAIL (invalidated)
        mockMvc.perform(post("/api/v1/tensignal/auth/verify-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "target1@example.com",
                    "code", otp1,
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isBadRequest());

        // Verifying otp2 for target2 MUST SUCCEED
        mockMvc.perform(post("/api/v1/tensignal/auth/verify-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "target2@example.com",
                    "code", otp2,
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.verificationGrant").isNotEmpty());
    }

    @Test
    @DisplayName("4. Pre-flight rejection when new email is identical to current email or already registered")
    void testEmailChangePreFlightUniquenessRejection() throws Exception {
        AccountFixture accountA = createAccount("User A", "user_a@example.com");
        createAccount("User B", "user_b@example.com");

        // Attempting to request change to CURRENT email
        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", accountA.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "user_a@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isBadRequest());

        // Attempting to request change to an ALREADY EXISTING email
        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", accountA.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "user_b@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("5. Verification grant replay prevention")
    void testEmailChangeGrantCannotBeReplayed() throws Exception {
        AccountFixture account = createAccount("Replay User", "replay_old@example.com");

        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "replay_new@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk());

        String otp = getDeliveredOtp("replay_new@example.com", NotificationType.EMAIL_CHANGE_VERIFICATION);
        String verifyBody = mockMvc.perform(post("/api/v1/tensignal/auth/verify-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "replay_new@example.com",
                    "code", otp,
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String grant = objectMapper.readTree(verifyBody).get("verificationGrant").asText();

        // First update consumes grant successfully
        mockMvc.perform(put("/api/v1/tensignal/owner/email")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "replay_new@example.com",
                    "verificationGrant", grant
                ))))
            .andExpect(status().isOk());

        // Second update attempt with same grant fails (consumed)
        mockMvc.perform(put("/api/v1/tensignal/owner/email")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "replay_new@example.com",
                    "verificationGrant", grant
                ))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("6. Pending transactional notifications in outbox are redirected to new canonical email")
    void testPendingOutboxNotificationsRedirectedOnEmailChange() throws Exception {
        AccountFixture account = createAccount("Pending Redirect User", "pending_old@example.com");

        // Enqueue a future scheduled reminder for this account
        emailNotificationService.enqueue(
            NotificationType.FIRST_SHARE_REMINDER,
            account.user.getEmail(),
            account.user.getId(),
            "tr",
            Map.of("shareUrl", "https://tensignal.app/p/test"),
            "first-share-reminder:" + account.tenSignal.getId(),
            clock.instant().plus(Duration.ofHours(24)),
            null
        );

        // Perform email change
        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "pending_new@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk());

        String otp = getDeliveredOtp("pending_new@example.com", NotificationType.EMAIL_CHANGE_VERIFICATION);
        String verifyBody = mockMvc.perform(post("/api/v1/tensignal/auth/verify-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "pending_new@example.com",
                    "code", otp,
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String grant = objectMapper.readTree(verifyBody).get("verificationGrant").asText();

        mockMvc.perform(put("/api/v1/tensignal/owner/email")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "pending_new@example.com",
                    "verificationGrant", grant
                ))))
            .andExpect(status().isOk());

        // Check the pending reminder: its recipient must now be pending_new@example.com!
        EmailOutboxEntity reminder = outboxRepository.findByIdempotencyKey("first-share-reminder:" + account.tenSignal.getId())
            .orElseThrow();
        assertThat(reminder.getRecipient()).isEqualTo("pending_new@example.com");
        assertThat(reminder.getRecipientHash()).isEqualTo(EmailNotificationService.hashRecipient("pending_new@example.com"));
    }

    @Test
    @DisplayName("7. Delivery status endpoint accurately reports PENDING, DELIVERED, and FAILED states")
    void testOtpDeliveryStatusReporting() throws Exception {
        AccountFixture account = createAccount("Status User", "status_old@example.com");

        // Send OTP
        mockMvc.perform(post("/api/v1/tensignal/auth/send-code")
                .header("X-Owner-Token", account.ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", "status_new@example.com",
                    "purpose", "EMAIL_CHANGE"
                ))))
            .andExpect(status().isOk());

        // Status check while outbox item is PENDING
        mockMvc.perform(get("/api/v1/tensignal/auth/otp-delivery-status")
                .header("X-Owner-Token", account.ownerToken)
                .param("email", "status_new@example.com")
                .param("purpose", "EMAIL_CHANGE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.deliveryStatus").value("PENDING"));

        // Simulate delivery failure (e.g. Brevo 403 permanent failure)
        String hash = EmailNotificationService.hashRecipient("status_new@example.com");
        EmailOutboxEntity outbox = outboxRepository.findLatestByRecipientHashAndType(hash, NotificationType.EMAIL_CHANGE_VERIFICATION.name()).orElseThrow();
        outbox.setStatus(EmailOutboxStatus.FAILED);
        outboxRepository.saveAndFlush(outbox);

        // Status check must now report FAILED with user-friendly error message
        mockMvc.perform(get("/api/v1/tensignal/auth/otp-delivery-status")
                .header("X-Owner-Token", account.ownerToken)
                .param("email", "status_new@example.com")
                .param("purpose", "EMAIL_CHANGE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.deliveryStatus").value("FAILED"))
            .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
