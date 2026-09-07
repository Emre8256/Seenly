package com.seenly.backend;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.constant.OtpPurpose;
import com.seenly.backend.entity.OtpChallenge;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.SelfAnswer;
import com.seenly.backend.repository.OtpChallengeRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.service.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AuthLifecycleIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AuthService authService;
    @Autowired OwnerSessionService ownerSessionService;
    @Autowired TokenHashingService tokenHashingService;
    @Autowired ScoringEngineService scoringEngineService;
    @Autowired SeenlyRepository seenlyRepository;
    @Autowired OtpChallengeRepository challengeRepository;
    @Autowired EntityManager entityManager;

    @MockBean OtpDeliveryService otpDeliveryService;

    private final Map<String, String> deliveredCodes = new HashMap<>();

    @BeforeEach
    void captureDeliveredCodes() {
        deliveredCodes.clear();
        doAnswer(invocation -> {
            String email = invocation.getArgument(0);
            String code = invocation.getArgument(1);
            OtpPurpose purpose = invocation.getArgument(2);
            deliveredCodes.put(email + "|" + purpose, code);
            return null;
        }).when(otpDeliveryService).send(anyString(), anyString(), any(OtpPurpose.class));
    }

    @Test
    void expiredOtpIsRejected() throws Exception {
        issue("expired@example.com", OtpPurpose.REGISTER, null);
        OtpChallenge challenge = challengeRepository.findAll().get(0);
        challenge.setExpiresAt(Instant.now().minusSeconds(1));
        challengeRepository.saveAndFlush(challenge);

        verify("expired@example.com", code("expired@example.com", OtpPurpose.REGISTER), "REGISTER", null)
            .andExpect(status().isBadRequest());
    }

    @Test
    void reusedOtpIsRejected() throws Exception {
        issue("used@example.com", OtpPurpose.REGISTER, null);
        String code = code("used@example.com", OtpPurpose.REGISTER);
        verify("used@example.com", code, "REGISTER", null).andExpect(status().isOk());
        verify("used@example.com", code, "REGISTER", null).andExpect(status().isBadRequest());
    }

    @Test
    void wrongPurposeOtpIsRejected() throws Exception {
        issue("purpose@example.com", OtpPurpose.REGISTER, null);
        mockMvc.perform(post("/api/v1/seenly/auth/login-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "purpose@example.com", "code", code("purpose@example.com", OtpPurpose.REGISTER)))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void wrongEmailOtpIsRejected() throws Exception {
        issue("right@example.com", OtpPurpose.REGISTER, null);
        verify("wrong@example.com", code("right@example.com", OtpPurpose.REGISTER), "REGISTER", null)
            .andExpect(status().isBadRequest());
    }

    @Test
    void maximumFailedAttemptsLocksOtp() throws Exception {
        issue("attempts@example.com", OtpPurpose.REGISTER, null);
        for (int i = 0; i < 5; i++) {
            verify("attempts@example.com", "9999", "REGISTER", null).andExpect(status().isBadRequest());
        }
        verify("attempts@example.com", code("attempts@example.com", OtpPurpose.REGISTER), "REGISTER", null)
            .andExpect(status().isBadRequest());
    }

    @Test
    void resendCooldownIsEnforced() throws Exception {
        issue("cooldown@example.com", OtpPurpose.REGISTER, null);
        mockMvc.perform(post("/api/v1/seenly/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "cooldown@example.com", "purpose", "REGISTER"))))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.retryAfterSeconds").isNumber());
    }

    @Test
    void newlyIssuedOtpReplacesOldOtp() throws Exception {
        issue("replacement@example.com", OtpPurpose.REGISTER, null);
        String oldCode = code("replacement@example.com", OtpPurpose.REGISTER);
        OtpChallenge challenge = challengeRepository.findAll().get(0);
        challenge.setResendAvailableAt(Instant.now().minusSeconds(1));
        challengeRepository.saveAndFlush(challenge);
        issue("replacement@example.com", OtpPurpose.REGISTER, null);
        String newCode = code("replacement@example.com", OtpPurpose.REGISTER);
        for (int i = 0; oldCode.equals(newCode) && i < 4; i++) {
            challenge = challengeRepository.findAll().get(0);
            challenge.setResendAvailableAt(Instant.now().minusSeconds(1));
            challengeRepository.saveAndFlush(challenge);
            issue("replacement@example.com", OtpPurpose.REGISTER, null);
            newCode = code("replacement@example.com", OtpPurpose.REGISTER);
        }
        assertThat(newCode).isNotEqualTo(oldCode);
        verify("replacement@example.com", oldCode, "REGISTER", null).andExpect(status().isBadRequest());
        verify("replacement@example.com", newCode, "REGISTER", null).andExpect(status().isOk());
    }

    @Test
    void plaintextOtpIsNotWrittenToAuthLogs() {
        Logger logger = (Logger) LoggerFactory.getLogger(AuthService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        try {
            issue("nolog@example.com", OtpPurpose.REGISTER, null);
            String otp = code("nolog@example.com", OtpPurpose.REGISTER);
            assertThat(challengeRepository.findAll().get(0).getCodeHash()).doesNotContain(otp);
            assertThat(appender.list).noneMatch(event -> event.getFormattedMessage().contains(otp));
        } finally {
            logger.detachAppender(appender);
        }
    }

    @Test
    void createWithoutRegistrationProofIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/seenly/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(createBody("No Proof", "no-proof@example.com", null))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void validRegistrationProofAllowsCreation() throws Exception {
        String grant = registrationGrant("valid-register@example.com");
        mockMvc.perform(post("/api/v1/seenly/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(createBody("Verified", "valid-register@example.com", grant))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ownerToken").isString())
            .andExpect(jsonPath("$.publicSlug").isString());
    }

    @Test
    void registrationProofCannotBeReplayed() throws Exception {
        String grant = registrationGrant("replay-register@example.com");
        mockMvc.perform(post("/api/v1/seenly/create").contentType(MediaType.APPLICATION_JSON)
            .content(json(createBody("First", "replay-register@example.com", grant)))).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/seenly/create").contentType(MediaType.APPLICATION_JSON)
            .content(json(createBody("Second", "replay-register@example.com", grant)))).andExpect(status().isBadRequest());
    }

    @Test
    void emailChangeWithoutProofIsRejected() throws Exception {
        Profile profile = createProfile("Owner", "owner-email@example.com");
        mockMvc.perform(put("/api/v1/seenly/owner/email")
                .header("X-Owner-Token", profile.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "new-owner@example.com", "verificationGrant", "invalid"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void validEmailChangeProofSucceeds() throws Exception {
        Profile profile = createProfile("Email Owner", "old-email@example.com");
        String grant = emailChangeGrant(profile.token(), "new-email@example.com");
        mockMvc.perform(put("/api/v1/seenly/owner/email")
                .header("X-Owner-Token", profile.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "new-email@example.com", "verificationGrant", grant))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("new-email@example.com"));
    }

    @Test
    void emailChangeProofCannotBeReplayed() throws Exception {
        Profile profile = createProfile("Replay Email", "old-replay@example.com");
        String grant = emailChangeGrant(profile.token(), "new-replay@example.com");
        Map<String, String> body = Map.of("email", "new-replay@example.com", "verificationGrant", grant);
        mockMvc.perform(put("/api/v1/seenly/owner/email").header("X-Owner-Token", profile.token())
            .contentType(MediaType.APPLICATION_JSON).content(json(body))).andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/seenly/owner/email").header("X-Owner-Token", profile.token())
            .contentType(MediaType.APPLICATION_JSON).content(json(body))).andExpect(status().isBadRequest());
    }

    @Test
    void loginOtpCannotBeReusedAndFreshSessionReplacesOldOne() throws Exception {
        Profile profile = createProfile("Login Owner", "login@example.com");
        issue("login@example.com", OtpPurpose.LOGIN, null);
        String otp = code("login@example.com", OtpPurpose.LOGIN);
        String response = mockMvc.perform(post("/api/v1/seenly/auth/login-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "login@example.com", "code", otp))))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String freshToken = objectMapper.readTree(response).get("ownerToken").asText();
        assertThat(freshToken).isNotEqualTo(profile.token());
        mockMvc.perform(get("/api/v1/seenly/owner").header("X-Owner-Token", profile.token()))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/seenly/owner").header("X-Owner-Token", freshToken))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/seenly/auth/login-email").contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("email", "login@example.com", "code", otp)))).andExpect(status().isBadRequest());
    }

    @Test
    void expiredOwnerSessionIsRejected() throws Exception {
        Profile profile = createProfile("Expired Owner", "expired-owner@example.com");
        Seenly seenly = seenlyRepository.findByPublicSlug(profile.slug()).orElseThrow();
        seenly.setOwnerTokenExpiresAt(Instant.now().minusSeconds(1));
        seenlyRepository.saveAndFlush(seenly);
        mockMvc.perform(get("/api/v1/seenly/owner").header("X-Owner-Token", profile.token()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void loggedOutOwnerSessionIsRevoked() throws Exception {
        Profile profile = createProfile("Logout Owner", "logout@example.com");
        mockMvc.perform(post("/api/v1/seenly/auth/logout").header("X-Owner-Token", profile.token()))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/seenly/owner").header("X-Owner-Token", profile.token()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void ownerTokenIsStoredOnlyAsAHash() {
        Profile profile = createProfile("Hashed Owner", "hashed@example.com");
        Seenly stored = seenlyRepository.findByPublicSlug(profile.slug()).orElseThrow();
        assertThat(stored.getOwnerTokenHash()).isNotEqualTo(profile.token());
        assertThat(stored.getOwnerTokenHash()).isEqualTo(tokenHashingService.hashToken(profile.token()));
    }

    @Test
    void existingValidOwnerReadAndMutationFlowsStillWork() throws Exception {
        Profile profile = createProfile("Valid Owner", "valid-owner@example.com");
        mockMvc.perform(get("/api/v1/seenly/owner").header("X-Owner-Token", profile.token()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.displayName").value("Valid Owner"));
        mockMvc.perform(put("/api/v1/seenly/owner/avatar").header("X-Owner-Token", profile.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"avatar\":\"kadin2\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.avatar").value("kadin2"));
    }

    private void issue(String email, OtpPurpose purpose, String ownerToken) {
        authService.sendVerificationCode(email, purpose, ownerToken);
    }

    private org.springframework.test.web.servlet.ResultActions verify(
            String email, String code, String purpose, String ownerToken) throws Exception {
        var request = post("/api/v1/seenly/auth/verify-code")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("email", email, "code", code, "purpose", purpose)));
        if (ownerToken != null) request.header("X-Owner-Token", ownerToken);
        return mockMvc.perform(request);
    }

    private String registrationGrant(String email) throws Exception {
        issue(email, OtpPurpose.REGISTER, null);
        String body = verify(email, code(email, OtpPurpose.REGISTER), "REGISTER", null)
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("verificationGrant").asText();
    }

    private String emailChangeGrant(String ownerToken, String newEmail) throws Exception {
        issue(newEmail, OtpPurpose.EMAIL_CHANGE, ownerToken);
        String body = verify(newEmail, code(newEmail, OtpPurpose.EMAIL_CHANGE), "EMAIL_CHANGE", ownerToken)
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("verificationGrant").asText();
    }

    private String code(String email, OtpPurpose purpose) {
        return deliveredCodes.get(email + "|" + purpose);
    }

    private Map<String, Object> createBody(String name, String email, String grant) {
        Map<String, Object> body = new HashMap<>();
        body.put("displayName", name);
        body.put("email", email);
        body.put("registrationGrant", grant);
        body.put("selfAnswers", AppConstants.LENSES.stream().map(lens -> Map.of(
            "questionId", "classic_self_" + lens + "_01", "answerValue", 3)).toList());
        return body;
    }

    private Profile createProfile(String name, String email) {
        OwnerSessionService.SessionCredentials session = ownerSessionService.newCredentials();
        Seenly seenly = Seenly.builder()
            .displayName(name).email(email).publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(session.tokenHash()).ownerTokenExpiresAt(session.expiresAt()).build();
        seenly.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(seenly).questionId("classic_self_" + lens + "_01").answerValue(3).build()).toList()));
        seenlyRepository.saveAndFlush(seenly);
        seenly.setResultSnapshot(scoringEngineService.calculateSelfResult(seenly));
        entityManager.flush();
        return new Profile(session.rawToken(), seenly.getPublicSlug());
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private record Profile(String token, String slug) { }
}
