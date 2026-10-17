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
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.service.AbuseSignalService;
import com.tensignal.backend.service.ScoringEngineService;
import com.tensignal.backend.service.TokenHashingService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class TenSignalPrivacyBoundaryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TenSignalRepository tenSignalRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResponseSessionRepository responseSessionRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TokenHashingService tokenHashingService;

    @Autowired
    private ScoringEngineService scoringEngineService;

    @Autowired
    private AbuseSignalService abuseSignalService;

    @Test
    void publicProfileExposesOnlyTheIntendedPublicContract() throws Exception {
        ProfileFixture profile = createProfile("Public Person", "owner@example.com");

        String body = mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.publicSlug").value(profile.publicSlug()))
            .andExpect(jsonPath("$.displayName").value("Public Person"))
            .andExpect(jsonPath("$.responseCount").value(0))
            .andExpect(jsonPath("$.acceptingResponses").value(true))
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(body);
        assertPrivateFieldsAbsent(json);
        assertThat(json.has("friendAverages")).isFalse();
    }

    @Test
    void publicProfileWithOneParticipantDoesNotExposeTheirAnswersOrAggregates() throws Exception {
        ProfileFixture profile = createProfile("Threshold Person", "threshold@example.com");
        addParticipantResponse(profile.publicSlug(), 5, "private-fingerprint", "198.51.100.9");

        String body = mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseCount").value(1))
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(body);
        assertPrivateFieldsAbsent(json);
        assertThat(json.has("friendAverages")).isFalse();
        assertThat(body).doesNotContain("private-fingerprint", "198.51.100.9", "private-nick");
    }

    @Test
    void publicProfileExposesAggregatesOnlyAfterMinimumThreshold() throws Exception {
        ProfileFixture profile = createProfile("Aggregate Person", "aggregate@example.com");
        for (int i = 0; i < AppConstants.MIN_RESPONSES_FOR_OUTSIDE; i++) {
            addParticipantResponse(profile.publicSlug(), i + 2, "fingerprint-" + i, "198.51.100." + (10 + i));
        }

        // Unauthenticated visitor is locked even after threshold
        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseCount").value(AppConstants.MIN_RESPONSES_FOR_OUTSIDE))
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(true))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").value("COMPLETE_TEST_REQUIRED"))
            .andExpect(jsonPath("$.friendAverages").doesNotExist())
            .andExpect(jsonPath("$.responseSessions").doesNotExist())
            .andExpect(jsonPath("$.email").doesNotExist());

        // Verified participant has access to aggregates once threshold is reached
        mockMvc.perform(get("/api/v1/tensignal/public/{slug}", profile.publicSlug())
                .header("X-Participant-Signal", "fingerprint-0"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseCount").value(AppConstants.MIN_RESPONSES_FOR_OUTSIDE))
            .andExpect(jsonPath("$.outsidePerceptionLocked").value(false))
            .andExpect(jsonPath("$.outsidePerceptionLockReason").doesNotExist())
            .andExpect(jsonPath("$.friendAverages.samimiyet").exists())
            .andExpect(jsonPath("$.responseSessions").doesNotExist())
            .andExpect(jsonPath("$.email").doesNotExist());
    }

    @Test
    void ownerDashboardWithOneParticipantCannotReconstructThatParticipantsAnswers() throws Exception {
        ProfileFixture profile = createProfile("Private Aggregate", "private-aggregate@example.com");
        addParticipantResponse(profile.publicSlug(), 5, "owner-hidden-fingerprint", "198.51.100.44");

        String body = mockMvc.perform(get("/api/v1/tensignal/owner")
                .header("X-Owner-Token", profile.ownerToken()))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(body);
        assertThat(json.get("friendAverages").isNull()).isTrue();
        assertThat(json.get("friendTimeAnalytics").isNull()).isTrue();
        assertThat(json.get("responseSessions").isNull()).isTrue();
        assertThat(body).doesNotContain("owner-hidden-fingerprint", "198.51.100.44", "private-nick");
    }

    @Test
    void premiumOwnerDashboardHistoryIsBoundedAndOwnerAuthorized() throws Exception {
        ProfileFixture profile = createProfile("Paged Owner", "paged-owner@example.com");
        TenSignal tenSignal = tenSignalRepository.findByPublicSlug(profile.publicSlug()).orElseThrow();
        User premiumUser = userRepository.saveAndFlush(User.builder()
            .email("premium-paged-owner@example.com")
            .emailVerified(true)
            .isPremium(true)
            .build());
        tenSignal.setUser(premiumUser);
        tenSignalRepository.saveAndFlush(tenSignal);
        for (int i = 0; i < 7; i++) {
            addParticipantResponse(profile.publicSlug(), 2 + (i % 4), "page-fingerprint-" + i, "198.51.100." + (60 + i));
        }

        mockMvc.perform(get("/api/v1/tensignal/owner")
                .header("X-Owner-Token", profile.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responseSessions").isArray())
            .andExpect(jsonPath("$.responseSessions").isEmpty());

        mockMvc.perform(get("/api/v1/tensignal/owner/responses")
                .header("X-Owner-Token", profile.ownerToken())
                .queryParam("limit", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items.length()").value(2))
            .andExpect(jsonPath("$.hasMore").value(true))
            .andExpect(jsonPath("$.nextCursor").isString())
            .andExpect(jsonPath("$.totalCount").value(7));

        mockMvc.perform(get("/api/v1/tensignal/owner/responses")
                .header("X-Owner-Token", "invalid-owner-token"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void ownerHistoryCompoundCursorDoesNotSkipOrDuplicateEqualTimestamps() throws Exception {
        ProfileFixture profile = createProfile("Cursor Owner", "cursor-owner@example.com");
        TenSignal tenSignal = tenSignalRepository.findByPublicSlug(profile.publicSlug()).orElseThrow();
        User premiumUser = userRepository.saveAndFlush(User.builder()
            .email("premium-cursor-owner@example.com").emailVerified(true).isPremium(true).build());
        tenSignal.setUser(premiumUser);
        tenSignalRepository.saveAndFlush(tenSignal);
        LocalDateTime sharedTime = LocalDateTime.of(2026, 9, 6, 12, 0);
        for (int i = 0; i < 5; i++) {
            addParticipantResponse(profile.publicSlug(), 3, "cursor-fingerprint-" + i,
                "198.51.100." + (80 + i), sharedTime);
        }

        String firstBody = mockMvc.perform(get("/api/v1/tensignal/owner/responses")
                .header("X-Owner-Token", profile.ownerToken()).queryParam("limit", "2"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(2))
            .andReturn().getResponse().getContentAsString();
        JsonNode first = objectMapper.readTree(firstBody);
        String cursor = first.get("nextCursor").asText();
        String secondBody = mockMvc.perform(get("/api/v1/tensignal/owner/responses")
                .header("X-Owner-Token", profile.ownerToken()).queryParam("limit", "2")
                .queryParam("cursor", cursor))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(2))
            .andReturn().getResponse().getContentAsString();
        JsonNode second = objectMapper.readTree(secondBody);
        Set<String> ids = new HashSet<>();
        first.get("items").forEach(item -> ids.add(item.get("id").asText()));
        second.get("items").forEach(item -> ids.add(item.get("id").asText()));
        assertThat(ids).hasSize(4);

        mockMvc.perform(get("/api/v1/tensignal/owner/responses")
                .header("X-Owner-Token", profile.ownerToken()).queryParam("cursor", "not-a-cursor"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Invalid response-history cursor."));
    }

    @Test
    void participantSubmissionReturnsOnlyTheParticipantsOwnResult() throws Exception {
        ProfileFixture profile = createProfile("Submission Person", "submission-owner@example.com");
        Map<String, Object> request = new HashMap<>();
        request.put("nickname", "private-nick");
        request.put("fingerprintHash", "submission-fingerprint");
        request.put("friendResponses", friendAnswers(5));
        request.put("friendTimeAnalytics", Map.of("samimiyet", 1234));

        String body = mockMvc.perform(post("/api/v1/tensignal/friend/{slug}/respond", profile.publicSlug())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.readerStyleId").isString())
            .andExpect(jsonPath("$.accuracy").isNumber())
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(body);
        assertThat(json.fieldNames()).toIterable()
            .containsExactlyInAnyOrder("readerStyleId", "xpGained", "level", "accuracy");
        assertThat(body).doesNotContain(
            "submission-owner@example.com",
            "submission-fingerprint",
            "private-nick",
            "resultSnapshot",
            "responseSessions",
            "friendAverages"
        );
    }

    @Test
    void eligibilityResponseUsesAMinimalParticipantSafeContract() throws Exception {
        ProfileFixture profile = createProfile("Eligible Person", "eligible@example.com");

        String body = mockMvc.perform(post("/api/v1/tensignal/friend/{slug}/check-eligibility", profile.publicSlug())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fingerprintHash\":\"eligibility-fingerprint\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.eligible").value(true))
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(body);
        assertThat(json.fieldNames()).toIterable().containsExactly("eligible");
    }

    @Test
    void userATokenReadsAndModifiesOnlyUserAProfile() throws Exception {
        ProfileFixture userA = createProfile("User A", "user-a@example.com");
        ProfileFixture userB = createProfile("User B", "user-b@example.com");

        mockMvc.perform(get("/api/v1/tensignal/owner")
                .header("X-Owner-Token", userA.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("user-a@example.com"))
            .andExpect(jsonPath("$.publicSlug").value(userA.publicSlug()));

        mockMvc.perform(put("/api/v1/tensignal/owner/display-name")
                .header("X-Owner-Token", userA.ownerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"displayName\":\"Updated A\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.displayName").value("Updated A"));

        TenSignal persistedB = tenSignalRepository.findByPublicSlug(userB.publicSlug()).orElseThrow();
        assertThat(persistedB.getDisplayName()).isEqualTo("User B");
        assertThat(persistedB.getEmail()).isEqualTo("user-b@example.com");
    }

    @Test
    void missingOrInvalidOwnerTokenReturnsControlledUnauthorizedResponse() throws Exception {
        mockMvc.perform(get("/api/v1/tensignal/owner"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.message").value("Owner session is missing, invalid, expired, or revoked."));

        mockMvc.perform(get("/api/v1/tensignal/owner")
                .header("X-Owner-Token", "not-a-valid-owner-token"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.message").value("Owner session is missing, invalid, expired, or revoked."));
    }

    @Test
    void ownerTokenIsNoLongerAcceptedInTheUrlPath() throws Exception {
        ProfileFixture profile = createProfile("No Path Token", "no-path-token@example.com");

        mockMvc.perform(get("/api/v1/tensignal/owner/{token}", profile.ownerToken()))
            .andExpect(status().is4xxClientError());
    }

    @Test
    void everyOwnerProfileMutationRejectsMissingAndInvalidTokens() throws Exception {
        assertUnauthorizedPut("/api/v1/tensignal/owner/display-name", "{\"displayName\":\"Changed\"}");
        assertUnauthorizedPut("/api/v1/tensignal/owner/email", "{\"email\":\"changed@example.com\",\"verificationGrant\":\"invalid-grant\"}");
        assertUnauthorizedPut("/api/v1/tensignal/owner/avatar", "{\"avatar\":\"kadin1\"}");
    }

    @Test
    void accountDeletionRequiresHeaderAuthenticationAndCannotDeleteAnotherOwner() throws Exception {
        ProfileFixture userA = createProfile("Delete A", "delete-a@example.com");
        ProfileFixture userB = createProfile("Keep B", "keep-b@example.com");

        mockMvc.perform(delete("/api/billing/delete-account"))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/billing/delete-account")
                .header("X-Owner-Token", "invalid-token"))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/billing/delete-account")
                .queryParam("ownerToken", userA.ownerToken()))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/billing/delete-account")
                .header("X-Owner-Token", userA.ownerToken()))
            .andExpect(status().isOk());
        entityManager.flush();
        entityManager.clear();

        assertThat(tenSignalRepository.findByPublicSlug(userA.publicSlug())).isEmpty();
        assertThat(tenSignalRepository.findByPublicSlug(userB.publicSlug())).isPresent();
    }

    private void assertUnauthorizedPut(String path, String jsonBody) throws Exception {
        mockMvc.perform(put(path)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonBody))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(put(path)
                .header("X-Owner-Token", "invalid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonBody))
            .andExpect(status().isUnauthorized());
    }

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

    private ResponseSession addParticipantResponse(String publicSlug, int answerValue, String fingerprint, String ipAddress) {
        return addParticipantResponse(publicSlug, answerValue, fingerprint, ipAddress, null);
    }

    private ResponseSession addParticipantResponse(String publicSlug, int answerValue, String fingerprint,
                                                   String ipAddress, LocalDateTime createdAt) {
        TenSignal tenSignal = tenSignalRepository.findByPublicSlug(publicSlug).orElseThrow();
        ResponseSession session = ResponseSession.builder()
            .seenly(tenSignal)
            .nickname("private-nick")
            .fingerprintHash(abuseSignalService.fingerprintHash(fingerprint))
            .ipAddress(ipAddress)
            .friendTimeAnalytics(Map.of("samimiyet", 900))
            .build();
        session.setCreatedAt(createdAt);
        session.setResponses(friendAnswers(answerValue).stream()
            .map(answer -> FriendResponse.builder()
                .responseSession(session)
                .questionId((String) answer.get("questionId"))
                .answerValue((Integer) answer.get("answerValue"))
                .build())
            .toList());
        responseSessionRepository.saveAndFlush(session);
        tenSignal.setResponseCount(tenSignal.getResponseCount() + 1);
        tenSignalRepository.saveAndFlush(tenSignal);
        scoringEngineService.recalculateResultSnapshot(tenSignal);
        entityManager.flush();
        entityManager.clear();
        return session;
    }

    private List<Map<String, Object>> friendAnswers(int value) {
        List<Map<String, Object>> answers = new ArrayList<>();
        for (String lens : AppConstants.LENSES) {
            answers.add(Map.of(
                "questionId", "classic_friend_" + lens + "_01",
                "answerValue", value
            ));
        }
        return answers;
    }

    private void assertPrivateFieldsAbsent(JsonNode json) {
        List<String> forbiddenFields = List.of(
            "email",
            "ownerToken",
            "ownerTokenHash",
            "responseSessions",
            "friendResponses",
            "responses",
            "selfAverages",
            "friendTimeAnalytics",
            "lastNameChangedAt",
            "nextAllowedNameChangeDate",
            "nameChangeDaysRemaining",
            "isPremium",
            "maxResponseLimit",
            "currentResponseCount",
            "totalProfileClicks"
        );
        forbiddenFields.forEach(field -> assertThat(json.has(field)).as(field).isFalse());
    }

    private record ProfileFixture(String ownerToken, String publicSlug) {
    }
}
