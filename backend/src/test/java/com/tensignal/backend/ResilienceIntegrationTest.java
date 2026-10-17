package com.tensignal.backend;

import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.constant.OtpPurpose;
import com.tensignal.backend.dto.CreateTenSignalRequest;
import com.tensignal.backend.dto.FriendResponseInput;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.SelfAnswer;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.exception.EmailDeliveryException;
import com.tensignal.backend.exception.PaymentProviderUnavailableException;
import com.tensignal.backend.payment.PaymentProductCatalog;
import com.tensignal.backend.payment.PaymentProvider;
import com.tensignal.backend.payment.PaymentStatus;
import com.tensignal.backend.repository.*;
import com.tensignal.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mail.MailSendException;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ResilienceIntegrationTest {
    @Autowired AuthService authService;
    @Autowired TenSignalService tenSignalService;
    @Autowired FriendResponseService friendResponseService;
    @Autowired PaymentCheckoutService checkoutService;
    @Autowired BillingService billingService;
    @Autowired CleanupBatchService cleanup;
    @Autowired TokenHashingService tokenHashingService;
    @Autowired ScoringEngineService scoringEngineService;
    @Autowired OwnerSessionService ownerSessionService;
    @Autowired OtpChallengeRepository challengeRepository;
    @Autowired VerificationGrantRepository grantRepository;
    @Autowired ResponseSessionRepository sessionRepository;
    @Autowired PaymentProviderEventRepository eventRepository;
    @Autowired PaymentTransactionRepository transactionRepository;
    @Autowired RateLimitBucketRepository rateLimitRepository;
    @SpyBean UserRepository userRepository;
    @SpyBean TenSignalRepository tenSignalRepository;
    @MockBean OtpDeliveryService otpDeliveryService;
    @MockBean PaymentProvider paymentProvider;

    private final Map<String, String> deliveredCodes = new HashMap<>();

    @BeforeEach
    void resetState() {
        reset(otpDeliveryService, paymentProvider, tenSignalRepository, userRepository);
        deliveredCodes.clear();
        doAnswer(invocation -> {
            deliveredCodes.put(invocation.getArgument(0) + "|" + invocation.getArgument(2), invocation.getArgument(1));
            return null;
        }).when(otpDeliveryService).send(anyString(), anyString(), any(OtpPurpose.class), anyString());
        doAnswer(invocation -> {
            deliveredCodes.put(invocation.getArgument(0) + "|" + invocation.getArgument(2), invocation.getArgument(1));
            return null;
        }).when(otpDeliveryService).send(anyString(), anyString(), any(OtpPurpose.class));
        when(paymentProvider.providerCode()).thenReturn("resilience-test");
        eventRepository.deleteAll();
        transactionRepository.deleteAll();
        sessionRepository.deleteAll();
        tenSignalRepository.deleteAll();
        userRepository.deleteAll();
        challengeRepository.deleteAll();
        grantRepository.deleteAll();
        rateLimitRepository.deleteAll();
    }

    @Test
    void smtpTimeoutOrDeliveryFailureRollsBackChallengeAndReturnsSafeFailure() {
        doThrow(new MailSendException("simulated SMTP timeout with infrastructure detail"))
            .when(otpDeliveryService).send(anyString(), anyString(), eq(OtpPurpose.REGISTER), anyString());
        doThrow(new MailSendException("simulated SMTP timeout with infrastructure detail"))
            .when(otpDeliveryService).send(anyString(), anyString(), eq(OtpPurpose.REGISTER));

        assertThatThrownBy(() -> authService.sendVerificationCode("smtp-failure@example.com", OtpPurpose.REGISTER, null))
            .isInstanceOf(EmailDeliveryException.class)
            .hasMessage("Verification email could not be delivered. Please try again shortly.");
        assertThat(challengeRepository.count()).isZero();
    }

    @Test
    void registrationGrantConsumptionRollsBackWhenProfileCreationFails() {
        String grant = grant("register-rollback@example.com", OtpPurpose.REGISTER, null);
        doThrow(new DataAccessResourceFailureException("simulated database outage"))
            .when(tenSignalRepository).save(any(TenSignal.class));

        assertThatThrownBy(() -> tenSignalService.createTenSignal(createRequest("register-rollback@example.com", grant)))
            .isInstanceOf(DataAccessResourceFailureException.class);
        reset(tenSignalRepository);

        assertThat(grantRepository.findById(tokenHashingService.hashToken(grant)).orElseThrow().getConsumedAt()).isNull();
        assertThat(tenSignalRepository.count()).isZero();
    }

    @Test
    void emailChangeGrantAndAddressRollBackTogether() {
        Profile profile = profile("old-resilience@example.com");
        String grant = grant("new-resilience@example.com", OtpPurpose.EMAIL_CHANGE, profile.token());
        doThrow(new DataAccessResourceFailureException("simulated database outage"))
            .when(tenSignalRepository).save(any(TenSignal.class));

        assertThatThrownBy(() -> tenSignalService.updateEmail(
            profile.token(), "new-resilience@example.com", grant)).isInstanceOf(DataAccessResourceFailureException.class);
        reset(tenSignalRepository);

        assertThat(tenSignalRepository.findById(profile.id()).orElseThrow().getEmail()).isEqualTo("old-resilience@example.com");
        assertThat(grantRepository.findById(tokenHashingService.hashToken(grant)).orElseThrow().getConsumedAt()).isNull();
    }

    @Test
    void participantFailureAfterSessionWriteRollsBackSessionAndCapacity() {
        Profile profile = profile("participant-rollback@example.com");
        doThrow(new DataAccessResourceFailureException("simulated database outage"))
            .when(tenSignalRepository).saveAndFlush(any(TenSignal.class));

        assertThatThrownBy(() -> friendResponseService.processFriendSubmission(
            profile.slug(), null, "192.0.2.12", friendRequest("resilience-device")))
            .isInstanceOf(DataAccessResourceFailureException.class);
        reset(tenSignalRepository);

        TenSignal persisted = tenSignalRepository.findById(profile.id()).orElseThrow();
        assertThat(persisted.getResponseCount()).isZero();
        assertThat(persisted.isCapped()).isFalse();
        assertThat(sessionRepository.countBySeenlyId(profile.id())).isZero();
    }

    @Test
    void checkoutTimeoutLeavesRecoverableLedgerWithoutEntitlement() {
        Profile profile = profile("checkout-timeout@example.com");
        when(paymentProvider.createCheckout(any())).thenThrow(new RuntimeException("provider timed out"));

        assertThatThrownBy(() -> checkoutService.createCheckout(profile.token(), PaymentProductCatalog.TEN_SIGNAL_PLUS))
            .isInstanceOf(PaymentProviderUnavailableException.class);

        assertThat(transactionRepository.findAll()).singleElement().satisfies(transaction -> {
            assertThat(transaction.getStatus()).isEqualTo(PaymentStatus.CREATED);
            assertThat(transaction.getEntitlementGrantedAt()).isNull();
            assertThat(transaction.getProviderCheckoutId()).isNull();
        });
        assertThat(userRepository.findById(profile.userId()).orElseThrow().getIsPremium()).isFalse();
    }

    @Test
    void malformedProviderCheckoutLeavesRecoverableLedgerWithoutEntitlement() {
        Profile profile = profile("checkout-malformed@example.com");
        when(paymentProvider.createCheckout(any()))
            .thenReturn(new com.tensignal.backend.payment.ProviderCheckout("", ""));

        assertThatThrownBy(() -> checkoutService.createCheckout(profile.token(), PaymentProductCatalog.TEN_SIGNAL_PLUS))
            .isInstanceOf(PaymentProviderUnavailableException.class);
        assertThat(transactionRepository.findAll()).singleElement().satisfies(transaction -> {
            assertThat(transaction.getStatus()).isEqualTo(PaymentStatus.CREATED);
            assertThat(transaction.getEntitlementGrantedAt()).isNull();
        });
    }

    @Test
    void accountDeletionRollsBackWhenFinalDeleteFails() {
        Profile profile = profile("delete-rollback@example.com");
        doThrow(new DataAccessResourceFailureException("simulated database outage"))
            .when(userRepository).delete(any(User.class));

        assertThatThrownBy(() -> billingService.deleteAccount(profile.token()))
            .isInstanceOf(DataAccessResourceFailureException.class);
        reset(userRepository);

        assertThat(userRepository.findById(profile.userId())).isPresent();
        assertThat(tenSignalRepository.findById(profile.id())).isPresent();
    }

    @Test
    void cleanupBatchesAreBoundedAndIdempotent() {
        authService.sendVerificationCode("cleanup@example.com", OtpPurpose.REGISTER, null);
        var challenge = challengeRepository.findAll().get(0);
        challenge.setExpiresAt(Instant.now().minusSeconds(172_800));
        challengeRepository.saveAndFlush(challenge);

        assertThat(cleanup.expiredOtps(Instant.now().minusSeconds(86_400), 500)).isEqualTo(1);
        assertThat(cleanup.expiredOtps(Instant.now().minusSeconds(86_400), 500)).isZero();
    }

    private String grant(String email, OtpPurpose purpose, String ownerToken) {
        authService.sendVerificationCode(email, purpose, ownerToken);
        String code = deliveredCodes.get(email + "|" + purpose);
        return authService.verifyCode(email, code, purpose, ownerToken).getVerificationGrant();
    }

    private CreateTenSignalRequest createRequest(String email, String grant) {
        return CreateTenSignalRequest.builder().displayName("Rollback User").email(email).registrationGrant(grant)
            .selfAnswers(AppConstants.LENSES.stream().map(lens -> CreateTenSignalRequest.SelfAnswerInput.builder()
                .questionId("classic_self_" + lens + "_01").answerValue(3).build()).toList()).build();
    }

    private FriendResponseInput friendRequest(String fingerprint) {
        return FriendResponseInput.builder().nickname("Resilience").fingerprintHash(fingerprint)
            .friendResponses(AppConstants.LENSES.stream().map(lens -> FriendResponseInput.AnswerInput.builder()
                .questionId("classic_friend_" + lens + "_01").answerValue(3).build()).toList())
            .friendTimeAnalytics(Map.of()).build();
    }

    private Profile profile(String email) {
        User user = userRepository.saveAndFlush(User.builder().email(email).emailVerified(true).build());
        OwnerSessionService.SessionCredentials session = ownerSessionService.newCredentials();
        TenSignal draft = TenSignal.builder().user(user).email(email).displayName("Resilience Owner")
            .publicSlug(tokenHashingService.generatePublicSlug()).ownerTokenHash(session.tokenHash())
            .ownerTokenExpiresAt(session.expiresAt()).selfAnswers(new ArrayList<>()).build();
        draft.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(draft).questionId("classic_self_" + lens + "_01").answerValue(3).build()).toList()));
        TenSignal tenSignal = tenSignalRepository.saveAndFlush(draft);
        tenSignal.setResultSnapshot(scoringEngineService.calculateSelfResult(tenSignal));
        tenSignalRepository.flush();
        return new Profile(tenSignal.getId(), user.getId(), tenSignal.getPublicSlug(), session.rawToken());
    }

    private record Profile(java.util.UUID id, java.util.UUID userId, String slug, String token) { }
}
