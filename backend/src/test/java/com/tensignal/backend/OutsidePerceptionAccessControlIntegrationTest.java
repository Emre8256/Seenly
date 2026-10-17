package com.tensignal.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.dto.CreateTenSignalRequest;
import com.tensignal.backend.entity.FriendResponse;
import com.tensignal.backend.entity.ResponseSession;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.SelfAnswer;
import com.tensignal.backend.repository.ResponseSessionRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.service.AbuseSignalService;
import com.tensignal.backend.service.ScoringEngineService;
import com.tensignal.backend.service.TokenHashingService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public class OutsidePerceptionAccessControlIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TenSignalRepository tenSignalRepository;

    @Autowired
    private ResponseSessionRepository responseSessionRepository;

    @Autowired
    private TokenHashingService tokenHashingService;

    @Autowired
    private AbuseSignalService abuseSignalService;

    @Autowired
    private ScoringEngineService scoringEngineService;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Scenario 1 & 15: No headers -> locked with COMPLETE_TEST_REQUIRED, outside keys absent from JSON")
    void unauthenticatedRequestIsLockedWithCompleteTestRequired() throws Exception {
        ProfileFixture profile = createProfileWithResponses("Alice", "alice@example.com", 3);

        String body = mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug()))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-store, max-age=0"))
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("COMPLETE_TEST_REQUIRED"))
            .andExpect(jsonPath("$.outsideSignatureId").doesNotExist())
            .andExpect(jsonPath("$.outsideFamilyId").doesNotExist())
            .andExpect(jsonPath("$.friendAverages").doesNotExist())
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(body);
        assertThat(json.has("outsideSignatureId")).isFalse();
        assertThat(json.has("outsideFamilyId")).isFalse();
        assertThat(json.has("friendAverages")).isFalse();
        assertThat(json.get("outsidePerceptionLocked").asBoolean()).isTrue();
        assertThat(json.get("outsidePerceptionLockReason").asText()).isEqualTo("COMPLETE_TEST_REQUIRED");
    }

    @Test
    @DisplayName("Scenario 2: Fake/random signal -> locked with COMPLETE_TEST_REQUIRED")
    void fakeOrRandomSignalIsRejected() throws Exception {
        ProfileFixture profile = createProfileWithResponses("Bob", "bob@example.com", 3);

        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", "completely-fake-unregistered-signal-12345"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("COMPLETE_TEST_REQUIRED"))
            .andExpect(jsonPath("$.outsideSignatureId").doesNotExist())
            .andExpect(jsonPath("$.friendAverages").doesNotExist());
    }

    @Test
    @DisplayName("Scenario 3 & 17: Target isolation - participant signal on TenSignal B cannot unlock TenSignal A")
    void participantSignalFromDifferentProfileCannotUnlockTargetProfile() throws Exception {
        ProfileFixture profileA = createProfileWithResponses("Target Person", "target@example.com", 3);
        ProfileFixture profileB = createProfile("Other Person", "other@example.com");

        String participantSignalForB = "participant-device-b";
        addParticipantResponse(profileB.publicSlug(), 4, participantSignalForB, "198.51.100.11");

        // Use TenSignal B's participant signal to query TenSignal A
        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profileA.publicSlug())
                .header("X-Participant-Signal", participantSignalForB))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("COMPLETE_TEST_REQUIRED"))
            .andExpect(jsonPath("$.outsideSignatureId").doesNotExist())
            .andExpect(jsonPath("$.friendAverages").doesNotExist());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "",
        "   ",
        "abc",
        "toolong_signal_that_exceeds_sixty_four_characters_limit_by_far_and_must_be_strictly_rejected_1234567890",
        "invalid!chars@#",
        "<script>alert(1)</script>",
        "has whitespace inside"
    })
    @DisplayName("Scenario 4: Malformed, blank, too short, too long, or special character signal is rejected")
    void malformedSignalsDoNotGrantAccess(String malformedSignal) throws Exception {
        ProfileFixture profile = createProfileWithResponses("Charlie", "charlie@example.com", 3);

        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", malformedSignal))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("COMPLETE_TEST_REQUIRED"))
            .andExpect(jsonPath("$.outsideSignatureId").doesNotExist());
    }

    @Test
    @DisplayName("Scenario 5, 6, 16 & 18: Query parameters and client boolean bypass attempts fail")
    void queryParametersAndClientFlagsCannotBypassAccessControl() throws Exception {
        ProfileFixture profile = createProfileWithResponses("Dave", "dave@example.com", 3);

        mockMvc.perform(get("/api/v1/tensignal/public/{slug}?completed=true&unlocked=true&canViewOutsidePerception=true&outsidePerceptionLocked=false", profile.publicSlug()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("COMPLETE_TEST_REQUIRED"))
            .andExpect(jsonPath("$.outsideSignatureId").doesNotExist())
            .andExpect(jsonPath("$.friendAverages").doesNotExist());
    }

    @Test
    @DisplayName("Scenario 7: Valid participant with responseCount 1 -> locked with INSUFFICIENT_RESPONSES")
    void validParticipantWithOneResponseIsLockedWithInsufficientResponses() throws Exception {
        ProfileFixture profile = createProfile("Eve", "eve@example.com");
        String signal = "eve-friend-signal-1";
        addParticipantResponse(profile.publicSlug(), 4, signal, "198.51.100.20");

        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", signal))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseCount").value(1))
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("INSUFFICIENT_RESPONSES"))
            .andExpect(jsonPath("$.outsideSignatureId").doesNotExist())
            .andExpect(jsonPath("$.outsideFamilyId").doesNotExist())
            .andExpect(jsonPath("$.friendAverages").doesNotExist());
    }

    @Test
    @DisplayName("Scenario 7: Valid participant with responseCount 2 -> locked with INSUFFICIENT_RESPONSES")
    void validParticipantWithTwoResponsesIsLockedWithInsufficientResponses() throws Exception {
        ProfileFixture profile = createProfile("Frank", "frank@example.com");
        String participantSignal = "frank-friend-signal-1";
        addParticipantResponse(profile.publicSlug(), 4, participantSignal, "198.51.100.21");
        addParticipantResponse(profile.publicSlug(), 3, "frank-friend-signal-2", "198.51.100.22");

        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", participantSignal))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseCount").value(2))
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("INSUFFICIENT_RESPONSES"))
            .andExpect(jsonPath("$.outsideSignatureId").doesNotExist())
            .andExpect(jsonPath("$.friendAverages").doesNotExist());
    }

    @Test
    @DisplayName("Scenario 8: Valid participant with responseCount 3 -> unlocked with outside perception data")
    void validParticipantWithThreeResponsesIsUnlocked() throws Exception {
        ProfileFixture profile = createProfile("Grace", "grace@example.com");
        String signal1 = "grace-friend-signal-1";
        addParticipantResponse(profile.publicSlug(), 5, signal1, "198.51.100.31");
        addParticipantResponse(profile.publicSlug(), 4, "grace-friend-signal-2", "198.51.100.32");
        addParticipantResponse(profile.publicSlug(), 3, "grace-friend-signal-3", "198.51.100.33");

        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", signal1))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseCount").value(3))
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(false))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").doesNotExist())
            .andExpect(jsonPath("$.outsideSignatureId").isNotEmpty())
            .andExpect(jsonPath("$.outsideFamilyId").isNotEmpty())
            .andExpect(jsonPath("$.friendAverages").isMap());
    }

    @ParameterizedTest
    @ValueSource(ints = {4, 5, 6})
    @DisplayName("Scenarios 9, 10, 11: Valid participant with responseCount 4, 5, 6 remains unlocked")
    void validParticipantWithFourFiveSixResponsesRemainsUnlocked(int totalResponses) throws Exception {
        ProfileFixture profile = createProfile("Heidi", "heidi" + totalResponses + "@example.com");
        String mySignal = "heidi-verified-signal";
        addParticipantResponse(profile.publicSlug(), 4, mySignal, "198.51.100.40");

        for (int i = 1; i < totalResponses; i++) {
            addParticipantResponse(profile.publicSlug(), 3, "heidi-other-signal-" + i, "198.51.100." + (40 + i));
        }

        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", mySignal))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseCount").value(totalResponses))
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(false))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").doesNotExist())
            .andExpect(jsonPath("$.outsideSignatureId").isNotEmpty())
            .andExpect(jsonPath("$.friendAverages").isMap());
    }

    @Test
    @DisplayName("Scenario 12: Owner token unlocks public dashboard when threshold is reached and preserves owner private access")
    void ownerTokenUnlocksPublicDashboardAndPreservesPrivateAccess() throws Exception {
        ProfileFixture profile = createProfileWithResponses("Owner Guy", "owner-guy@example.com", 3);

        // 1. Owner accesses public dashboard with X-Owner-Token
        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Owner-Token", profile.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(false))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").doesNotExist())
            .andExpect(jsonPath("$.outsideSignatureId").isNotEmpty())
            .andExpect(jsonPath("$.friendAverages").isMap());

        // 2. Owner accesses private endpoint /owner
        mockMvc.perform(get("/api/v1/tensignal/owner")
                .header("X-Owner-Token", profile.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("owner-guy@example.com"))
            .andExpect(jsonPath("$.selfSignatureId").isNotEmpty());

        // 3. Owner token cannot be used as X-Participant-Signal
        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", profile.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("COMPLETE_TEST_REQUIRED"));

        // 4. Participant signal cannot be used as X-Owner-Token
        mockMvc.perform(get("/api/v1/tensignal/owner")
                .header("X-Owner-Token", "some-participant-signal-12345"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Scenario 13: Response contains Cache-Control: private, no-store, max-age=0")
    void responseContainsNoStorePrivateCacheControl() throws Exception {
        ProfileFixture profile = createProfileWithResponses("Cache Person", "cache@example.com", 3);

        // Locked response
        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug()))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-store, max-age=0"));

        // Unlocked response
        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Owner-Token", profile.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-store, max-age=0"));
    }

    @Test
    @DisplayName("Scenario 14: Zero private data leakage - raw answers, IPs, fingerprints, owner tokens never appear")
    void rawDataNeverLeaksInPublicResponses() throws Exception {
        ProfileFixture profile = createProfile("Leak Test", "leak@example.com");
        String signal = "secret-participant-signal-99";
        String secretIp = "198.51.100.99";
        addParticipantResponse(profile.publicSlug(), 5, signal, secretIp);

        // Unauthenticated visitor
        String publicBodyLocked = mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug()))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        assertThat(publicBodyLocked)
            .doesNotContain(signal)
            .doesNotContain(secretIp)
            .doesNotContain(profile.ownerToken())
            .doesNotContain("leak@example.com")
            .doesNotContain("private-nick");

        // Verified participant request (still locked because count=1)
        String participantBody = mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", signal))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        assertThat(participantBody)
            .doesNotContain(secretIp)
            .doesNotContain(profile.ownerToken())
            .doesNotContain("leak@example.com")
            .doesNotContain("private-nick");
    }

    // Helper fixture methods
    private ProfileFixture createProfile(String displayName, String email) {
        List<CreateTenSignalRequest.SelfAnswerInput> answers = new ArrayList<>();
        for (String lens : AppConstants.LENSES) {
            answers.add(new CreateTenSignalRequest.SelfAnswerInput("classic_self_" + lens + "_01", 3));
        }
        String rawToken = tokenHashingService.generateRawToken();
        TenSignal tenSignal = TenSignal.builder()
            .displayName(displayName)
            .email(email)
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken(rawToken))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600))
            .build();
        tenSignal.setSelfAnswers(answers.stream().map(answer -> SelfAnswer.builder()
            .seenly(tenSignal)
            .questionId(answer.getQuestionId())
            .answerValue(answer.getAnswerValue())
            .build()).toList());
        tenSignalRepository.saveAndFlush(tenSignal);
        tenSignal.setResultSnapshot(scoringEngineService.calculateSelfResult(tenSignal));
        entityManager.flush();
        entityManager.clear();
        return new ProfileFixture(rawToken, tenSignal.getPublicSlug());
    }

    private ProfileFixture createProfileWithResponses(String displayName, String email, int responseCount) {
        ProfileFixture fixture = createProfile(displayName, email);
        for (int i = 0; i < responseCount; i++) {
            addParticipantResponse(fixture.publicSlug(), (i % 5) + 1, "test-participant-signal-" + i, "198.51.100." + (50 + i));
        }
        return fixture;
    }

    private ResponseSession addParticipantResponse(String publicSlug, int answerValue, String rawSignal, String ipAddress) {
        TenSignal tenSignal = tenSignalRepository.findByPublicSlug(publicSlug).orElseThrow();
        String hashedSignal = abuseSignalService.fingerprintHash(rawSignal);

        ResponseSession session = ResponseSession.builder()
            .seenly(tenSignal)
            .nickname("private-nick")
            .fingerprintHash(hashedSignal)
            .ipAddress(ipAddress)
            .friendTimeAnalytics(Map.of("samimiyet", 900))
            .build();

        List<FriendResponse> responses = new ArrayList<>();
        for (String lens : AppConstants.LENSES) {
            responses.add(FriendResponse.builder()
                .responseSession(session)
                .questionId("classic_friend_" + lens + "_01")
                .answerValue(answerValue)
                .build());
        }
        session.setResponses(responses);
        responseSessionRepository.saveAndFlush(session);

        tenSignal.setResponseCount(tenSignal.getResponseCount() + 1);
        tenSignalRepository.saveAndFlush(tenSignal);
        scoringEngineService.recalculateResultSnapshot(tenSignal);
        entityManager.flush();
        entityManager.clear();
        return session;
    }

    private record ProfileFixture(String ownerToken, String publicSlug) {}
}
