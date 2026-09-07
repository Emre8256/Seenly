package com.seenly.backend;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seenly.backend.config.RequestCorrelationFilter;
import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.constant.OtpPurpose;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.SelfAnswer;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.service.AuthService;
import com.seenly.backend.service.OtpDeliveryService;
import com.seenly.backend.service.RateLimitService;
import com.seenly.backend.service.ScoringEngineService;
import com.seenly.backend.service.TokenHashingService;
import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@Import(ObservabilityIntegrationTest.BoomController.class)
class ObservabilityIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired AuthService authService;
    @Autowired SeenlyRepository seenlyRepository;
    @Autowired TokenHashingService tokenHashingService;
    @Autowired ScoringEngineService scoringEngineService;
    @Autowired RateLimitService rateLimitService;
    @Autowired MeterRegistry meterRegistry;
    @MockBean OtpDeliveryService otpDeliveryService;

    private final Map<String, String> deliveredCodes = new HashMap<>();

    @BeforeEach
    void captureCodes() {
        deliveredCodes.clear();
        doAnswer(invocation -> {
            deliveredCodes.put(invocation.getArgument(0) + "|" + invocation.getArgument(2), invocation.getArgument(1));
            return null;
        }).when(otpDeliveryService).send(anyString(), anyString(), any(OtpPurpose.class));
    }

    @Test
    void requestIdIsAcceptedOrGeneratedSafelyAndMdcIsCleared() throws Exception {
        String accepted = "edge-request_2026.09";
        mockMvc.perform(get("/actuator/health/liveness").header(RequestCorrelationFilter.REQUEST_ID_HEADER, accepted))
            .andExpect(status().isOk())
            .andExpect(header().string(RequestCorrelationFilter.REQUEST_ID_HEADER, accepted));
        assertThat(MDC.get(RequestCorrelationFilter.REQUEST_ID_MDC_KEY)).isNull();

        String oversized = "x".repeat(5000);
        String replacement = mockMvc.perform(get("/actuator/health/liveness")
                .header(RequestCorrelationFilter.REQUEST_ID_HEADER, oversized))
            .andExpect(status().isOk()).andReturn().getResponse()
            .getHeader(RequestCorrelationFilter.REQUEST_ID_HEADER);
        assertThat(replacement).isNotBlank().hasSizeLessThanOrEqualTo(64).isNotEqualTo(oversized);
        assertThat(MDC.get(RequestCorrelationFilter.REQUEST_ID_MDC_KEY)).isNull();
    }

    @Test
    void completionLogContainsOperationalFieldsAndNormalizedPath() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger(RequestCorrelationFilter.class);
        ListAppender<ILoggingEvent> appender = attach(logger);
        try {
            mockMvc.perform(get("/api/v1/seenly/public/NotFound")).andExpect(status().isNotFound());
            ILoggingEvent event = appender.list.stream()
                .filter(item -> item.getFormattedMessage().equals("http_request_completed"))
                .reduce((first, second) -> second).orElseThrow();
            assertThat(event.getMDCPropertyMap())
                .containsKeys("requestId", "httpMethod", "httpPath", "httpStatus", "durationMs")
                .containsEntry("httpMethod", "GET")
                .containsEntry("httpPath", "/api/v1/seenly/public/{publicSlug}")
                .containsEntry("httpStatus", "404");
        } finally {
            logger.detachAppender(appender);
        }
    }

    @Test
    void secretsAndPrivateAssessmentDataNeverReachCapturedLogs() throws Exception {
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        ListAppender<ILoggingEvent> appender = attach(root);
        try {
            String email = "private-log-check@example.com";
            authService.sendVerificationCode(email, OtpPurpose.REGISTER, null);
            String otp = deliveredCodes.get(email + "|REGISTER");
            String verification = mockMvc.perform(post("/api/v1/seenly/auth/verify-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("email", email, "code", otp, "purpose", "REGISTER"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            String grant = objectMapper.readTree(verification).get("verificationGrant").asText();
            String created = mockMvc.perform(post("/api/v1/seenly/create")
                    .contentType(MediaType.APPLICATION_JSON).content(json(createBody(email, grant))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            JsonNode profile = objectMapper.readTree(created);
            String ownerToken = profile.get("ownerToken").asText();
            String rawFingerprint = "raw-fingerprint-PRIVATE-784521";
            mockMvc.perform(post("/api/v1/seenly/auth/logout").header("X-Owner-Token", ownerToken))
                .andExpect(status().isNoContent());
            mockMvc.perform(post("/api/v1/seenly/friend/{slug}/respond", profile.get("publicSlug").asText())
                    .contentType(MediaType.APPLICATION_JSON).content(json(submission(rawFingerprint))))
                .andExpect(status().isOk());

            String logs = captured(appender);
            assertThat(logs).doesNotContain(otp, grant, ownerToken, rawFingerprint, email,
                "PRIVATE_NICK_7845", "answerValue", "classic_friend_samimiyet_01");
        } finally {
            root.detachAppender(appender);
        }
    }

    @Test
    void generic500HasCorrelationIdWithoutInternalDetailsAndIsLoggedOnce() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger("com.seenly.backend.exception.GlobalExceptionHandler");
        ListAppender<ILoggingEvent> appender = attach(logger);
        try {
            mockMvc.perform(get("/test/observability/boom").header("X-Request-ID", "boom-correlation"))
                .andExpect(status().isInternalServerError())
                .andExpect(header().string("X-Request-ID", "boom-correlation"))
                .andExpect(jsonPath("$.requestId").value("boom-correlation"))
                .andExpect(jsonPath("$.message").value("An unexpected server error occurred"))
                .andExpect(result -> assertThat(result.getResponse().getContentAsString())
                    .doesNotContain("INTERNAL_PRIVATE_DETAIL", "IllegalStateException", "stackTrace"));
            assertThat(appender.list.stream().filter(e -> e.getLevel() == Level.ERROR
                && e.getFormattedMessage().startsWith("unexpected_server_error")).count()).isEqualTo(1);
        } finally {
            logger.detachAppender(appender);
        }
    }

    @Test
    void validationErrorsDoNotCreateErrorStackTraces() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger("com.seenly.backend.exception.GlobalExceptionHandler");
        ListAppender<ILoggingEvent> appender = attach(logger);
        try {
            mockMvc.perform(post("/api/v1/seenly/auth/send-code").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"invalid\",\"purpose\":\"REGISTER\"}"))
                .andExpect(status().isBadRequest());
            assertThat(appender.list).noneMatch(event -> event.getLevel() == Level.ERROR
                || event.getThrowableProxy() != null);
        } finally {
            logger.detachAppender(appender);
        }
    }

    @Test
    void rateLimitDuplicateAndAuthenticationMetricsUseBoundedTags() throws Exception {
        double rateBefore = count("seenly.security.rate_limits", "policy", "REGISTER");
        rateLimitService.check("REGISTER", "metric-subject", 1, Duration.ofMinutes(1));
        try {
            rateLimitService.check("REGISTER", "metric-subject", 1, Duration.ofMinutes(1));
        } catch (RuntimeException ignored) { }
        assertThat(count("seenly.security.rate_limits", "policy", "REGISTER")).isEqualTo(rateBefore + 1);

        double authSuccess = count("seenly.auth.otp.verifications", "purpose", "REGISTER", "outcome", "success");
        double authFailure = count("seenly.auth.otp.verifications", "purpose", "REGISTER", "outcome", "failure");
        authService.sendVerificationCode("metric-auth@example.com", OtpPurpose.REGISTER, null);
        authService.verifyCode("metric-auth@example.com", deliveredCodes.get("metric-auth@example.com|REGISTER"),
            OtpPurpose.REGISTER, null);
        authService.sendVerificationCode("metric-fail@example.com", OtpPurpose.REGISTER, null);
        try {
            authService.verifyCode("metric-fail@example.com", "9999", OtpPurpose.REGISTER, null);
        } catch (RuntimeException ignored) { }
        assertThat(count("seenly.auth.otp.verifications", "purpose", "REGISTER", "outcome", "success"))
            .isEqualTo(authSuccess + 1);
        assertThat(count("seenly.auth.otp.verifications", "purpose", "REGISTER", "outcome", "failure"))
            .isEqualTo(authFailure + 1);

        Profile target = profile();
        double loginSuccess = count("seenly.auth.logins", "outcome", "success");
        double loginFailure = count("seenly.auth.logins", "outcome", "failure");
        authService.sendVerificationCode("metrics-target@example.com", OtpPurpose.LOGIN, null);
        String loginCode = deliveredCodes.get("metrics-target@example.com|LOGIN");
        authService.loginWithEmail("metrics-target@example.com", loginCode);
        try {
            authService.loginWithEmail("metrics-target@example.com", loginCode);
        } catch (RuntimeException ignored) { }
        assertThat(count("seenly.auth.logins", "outcome", "success")).isEqualTo(loginSuccess + 1);
        assertThat(count("seenly.auth.logins", "outcome", "failure")).isEqualTo(loginFailure + 1);

        double duplicates = count("seenly.participant.submissions", "outcome", "duplicate");
        Map<String, Object> body = submission("duplicate-metric-signal");
        mockMvc.perform(post("/api/v1/seenly/friend/{slug}/respond", target.slug())
            .contentType(MediaType.APPLICATION_JSON).content(json(body))).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/seenly/friend/{slug}/respond", target.slug())
            .contentType(MediaType.APPLICATION_JSON).content(json(body))).andExpect(status().isConflict());
        assertThat(count("seenly.participant.submissions", "outcome", "duplicate")).isEqualTo(duplicates + 1);

        List<String> forbidden = List.of("metric-auth@example.com", target.slug(), target.token(), "duplicate-metric-signal");
        for (Meter meter : meterRegistry.getMeters()) {
            meter.getId().getTags().forEach(tag -> forbidden.forEach(value ->
                assertThat(tag.getValue()).doesNotContain(value)));
        }
    }

    private Profile profile() {
        String token = tokenHashingService.generateRawToken();
        Seenly seenly = Seenly.builder().displayName("Metrics Target").email("metrics-target@example.com")
            .publicSlug(tokenHashingService.generatePublicSlug()).ownerTokenHash(tokenHashingService.hashToken(token))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600)).build();
        seenly.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(seenly).questionId("classic_self_" + lens + "_01").answerValue(3).build()).toList()));
        seenlyRepository.saveAndFlush(seenly);
        seenly.setResultSnapshot(scoringEngineService.calculateSelfResult(seenly));
        return new Profile(token, seenly.getPublicSlug());
    }

    private Map<String, Object> createBody(String email, String grant) {
        return Map.of("displayName", "Private Log Owner", "email", email, "registrationGrant", grant,
            "selfAnswers", AppConstants.LENSES.stream().map(lens -> Map.of(
                "questionId", "classic_self_" + lens + "_01", "answerValue", 4)).toList());
    }

    private Map<String, Object> submission(String fingerprint) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("nickname", "PRIVATE_NICK_7845");
        body.put("fingerprintHash", fingerprint);
        body.put("friendResponses", AppConstants.LENSES.stream().map(lens -> Map.of(
            "questionId", "classic_friend_" + lens + "_01", "answerValue", 5)).toList());
        body.put("friendTimeAnalytics", Map.of("samimiyet", 777));
        return body;
    }

    private ListAppender<ILoggingEvent> attach(Logger logger) {
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        return appender;
    }

    private String captured(ListAppender<ILoggingEvent> appender) {
        return appender.list.stream().map(event -> event.getFormattedMessage() + event.getMDCPropertyMap())
            .reduce("", (left, right) -> left + "\n" + right);
    }

    private double count(String name, String... tags) {
        var counter = meterRegistry.find(name).tags(tags).counter();
        return counter == null ? 0 : counter.count();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    record Profile(String token, String slug) { }

    @RestController
    static class BoomController {
        @GetMapping("/test/observability/boom")
        void boom() {
            throw new IllegalStateException("INTERNAL_PRIVATE_DETAIL");
        }
    }
}
