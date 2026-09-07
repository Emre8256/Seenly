package com.seenly.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.dto.CreateSeenlyRequest;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.SelfAnswer;
import com.seenly.backend.repository.ResponseSessionRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.service.OtpDeliveryService;
import com.seenly.backend.service.ScoringEngineService;
import com.seenly.backend.service.TokenHashingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.rate-limit.otp-send-per-network=3",
    "app.rate-limit.otp-send-per-email=2",
    "app.rate-limit.submission-per-target-network=2",
    "app.rate-limit.submission-per-network=3"
})
class ParticipantAbuseProtectionIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired SeenlyRepository seenlyRepository;
    @Autowired ResponseSessionRepository responseSessionRepository;
    @Autowired TokenHashingService tokenHashingService;
    @Autowired ScoringEngineService scoringEngineService;

    @MockBean OtpDeliveryService otpDeliveryService;

    @Test
    void eligibilityIsAdvisoryAndSubmissionAuthoritativelyRejectsReplay() throws Exception {
        Profile profile = createProfile("Replay Target", "replay@example.com");
        String signal = "stable-client-signal";

        mockMvc.perform(post("/api/v1/seenly/friend/{slug}/check-eligibility", profile.slug())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fingerprintHash\":\"" + signal + "\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.eligible").value(true));

        submit(profile.slug(), signal, "203.0.113.1", validSubmission(signal))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/seenly/friend/{slug}/check-eligibility", profile.slug())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fingerprintHash\":\"" + signal + "\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.eligible").value(false));

        submit(profile.slug(), signal, "203.0.113.1", validSubmission(signal))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.eligible").value(false));

        Seenly persisted = seenlyRepository.findByPublicSlug(profile.slug()).orElseThrow();
        assertThat(persisted.getResponseCount()).isEqualTo(1);
        assertThat(responseSessionRepository.findAll()).hasSize(1);
    }

    @Test
    void sharedNetworkDoesNotMakeDistinctParticipantsDuplicates() throws Exception {
        Profile profile = createProfile("Shared Network", "shared-network@example.com");

        submit(profile.slug(), "device-one", "198.51.100.7", validSubmission("device-one"))
            .andExpect(status().isOk());
        submit(profile.slug(), "device-two", "198.51.100.7", validSubmission("device-two"))
            .andExpect(status().isOk());

        assertThat(seenlyRepository.findByPublicSlug(profile.slug()).orElseThrow().getResponseCount()).isEqualTo(2);
    }

    @Test
    void oneParticipantMayRespondToDifferentProfiles() throws Exception {
        Profile first = createProfile("First Target", "first-target@example.com");
        Profile second = createProfile("Second Target", "second-target@example.com");

        submit(first.slug(), "same-device", "192.0.2.8", validSubmission("same-device"))
            .andExpect(status().isOk());
        submit(second.slug(), "same-device", "192.0.2.8", validSubmission("same-device"))
            .andExpect(status().isOk());
    }

    @Test
    void storedAbuseSignalsAreServerHashedRatherThanRawIdentifiers() throws Exception {
        Profile profile = createProfile("Hash Target", "hash-target@example.com");
        submit(profile.slug(), "raw-browser-signal", "192.0.2.25", validSubmission("raw-browser-signal"))
            .andExpect(status().isOk());

        ResponseSession stored = responseSessionRepository.findAll().get(0);
        assertThat(stored.getFingerprintHash()).isNotEqualTo("raw-browser-signal").hasSize(43);
        assertThat(stored.getIpAddress()).isNotEqualTo("192.0.2.25").hasSize(43);
    }

    @Test
    void rejectsOutOfRangeDuplicateUnknownAndMissingAnswers() throws Exception {
        Profile profile = createProfile("Validation Target", "validation@example.com");

        Map<String, Object> below = validSubmission("below");
        answers(below).get(0).put("answerValue", 0);
        submit(profile.slug(), "below", "10.0.0.1", below).andExpect(status().isBadRequest());

        Map<String, Object> above = validSubmission("above");
        answers(above).get(0).put("answerValue", 6);
        submit(profile.slug(), "above", "10.0.0.2", above).andExpect(status().isBadRequest());

        Map<String, Object> duplicate = validSubmission("duplicate");
        answers(duplicate).get(1).put("questionId", answers(duplicate).get(0).get("questionId"));
        submit(profile.slug(), "duplicate", "10.0.0.3", duplicate).andExpect(status().isBadRequest());

        Map<String, Object> unknown = validSubmission("unknown");
        answers(unknown).get(9).put("questionId", "classic_friend_unknown_01");
        submit(profile.slug(), "unknown", "10.0.0.4", unknown).andExpect(status().isBadRequest());

        Map<String, Object> missing = validSubmission("missing");
        answers(missing).remove(9);
        submit(profile.slug(), "missing", "10.0.0.5", missing).andExpect(status().isBadRequest());

        assertThat(responseSessionRepository.count()).isZero();
    }

    @Test
    void rejectsOversizedFingerprintAndInvalidTimingPayloads() throws Exception {
        Profile profile = createProfile("Bound Target", "bounds@example.com");
        String oversized = "x".repeat(129);
        submit(profile.slug(), oversized, "10.1.0.1", validSubmission(oversized))
            .andExpect(status().isBadRequest());

        Map<String, Object> tooManyTimings = validSubmission("timing-many");
        Map<String, Integer> timing = new LinkedHashMap<>();
        for (int i = 0; i < 11; i++) timing.put("key" + i, i);
        tooManyTimings.put("friendTimeAnalytics", timing);
        submit(profile.slug(), "timing-many", "10.1.0.2", tooManyTimings)
            .andExpect(status().isBadRequest());

        Map<String, Object> invalidTiming = validSubmission("timing-invalid");
        invalidTiming.put("friendTimeAnalytics", Map.of("samimiyet", 600_001));
        submit(profile.slug(), "timing-invalid", "10.1.0.3", invalidTiming)
            .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsMalformedEmailAndClientControlledPaymentProduct() throws Exception {
        mockMvc.perform(post("/api/v1/seenly/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"not-an-email\",\"purpose\":\"REGISTER\"}"))
            .andExpect(status().isBadRequest());

        Profile profile = createProfile("Pack Target", "pack-target@example.com");
        mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", profile.ownerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productCode\":\"unknown\",\"capacityAmount\":999999}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void otpSendEndpointEventuallyReturnsControlledRateLimit() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/v1/seenly/auth/send-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"rate" + i + "@example.com\",\"purpose\":\"REGISTER\"}"))
                .andExpect(status().isOk());
        }
        mockMvc.perform(post("/api/v1/seenly/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"rate-last@example.com\",\"purpose\":\"REGISTER\"}"))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.retryAfterSeconds").isNumber());
    }

    @Test
    void submissionEndpointAllowsNormalUseThenReturnsControlledRateLimit() throws Exception {
        Profile profile = createProfile("Rate Target", "rate-target@example.com");
        submit(profile.slug(), "rate-one", "172.16.0.3", validSubmission("rate-one"))
            .andExpect(status().isOk());
        submit(profile.slug(), "rate-two", "172.16.0.3", validSubmission("rate-two"))
            .andExpect(status().isOk());
        submit(profile.slug(), "rate-three", "172.16.0.3", validSubmission("rate-three"))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.retryAfterSeconds").isNumber());
    }

    @Test
    void cardRarityMutationEndpointIsNotExternallyReachable() throws Exception {
        mockMvc.perform(post("/api/v1/rarity/event/generated")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cardId\":\"attacker_created_card\"}"))
            .andExpect(status().is4xxClientError());

        mockMvc.perform(get("/api/v1/rarity/card/{cardId}", "attacker_created_card"))
            .andExpect(status().isBadRequest());
    }

    private org.springframework.test.web.servlet.ResultActions submit(
            String slug, String signal, String remoteAddress, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post("/api/v1/seenly/friend/{slug}/respond", slug)
            .with(request -> { request.setRemoteAddr(remoteAddress); return request; })
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body)));
    }

    private Map<String, Object> validSubmission(String signal) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("nickname", "Participant");
        body.put("fingerprintHash", signal);
        List<Map<String, Object>> responseAnswers = new ArrayList<>();
        for (String lens : AppConstants.LENSES) {
            Map<String, Object> answer = new LinkedHashMap<>();
            answer.put("questionId", "classic_friend_" + lens + "_01");
            answer.put("answerValue", 3);
            responseAnswers.add(answer);
        }
        body.put("friendResponses", responseAnswers);
        body.put("friendTimeAnalytics", Map.of("samimiyet", 500));
        return body;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> answers(Map<String, Object> body) {
        return (List<Map<String, Object>>) body.get("friendResponses");
    }

    private Profile createProfile(String name, String email) {
        String token = tokenHashingService.generateRawToken();
        Seenly seenly = Seenly.builder()
            .displayName(name).email(email)
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken(token))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600))
            .build();
        seenly.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(seenly).questionId("classic_self_" + lens + "_01").answerValue(3).build()).toList()));
        seenlyRepository.saveAndFlush(seenly);
        seenly.setResultSnapshot(scoringEngineService.calculateSelfResult(seenly));
        return new Profile(token, seenly.getPublicSlug());
    }

    private record Profile(String ownerToken, String slug) {}
}
