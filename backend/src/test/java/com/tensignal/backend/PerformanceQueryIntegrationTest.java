package com.tensignal.backend;

import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.dto.PublicProfileDto;
import com.tensignal.backend.entity.*;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.service.ScoringEngineService;
import com.tensignal.backend.service.TenSignalService;
import com.tensignal.backend.service.TokenHashingService;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class PerformanceQueryIntegrationTest {
    @Autowired EntityManager entityManager;
    @Autowired UserRepository userRepository;
    @Autowired TenSignalRepository tenSignalRepository;
    @Autowired TenSignalService tenSignalService;
    @Autowired ScoringEngineService scoringEngineService;
    @Autowired TokenHashingService tokenHashingService;

    @Test
    void publicAggregateQueryCountDoesNotGrowWithParticipantHistory() {
        User user = userRepository.save(User.builder().email("query-budget@example.com").isPremium(true).build());
        TenSignal draft = TenSignal.builder().user(user).email(user.getEmail()).displayName("Query Budget")
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken("query-budget-token"))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600)).responseCount(100)
            .selfAnswers(new ArrayList<>()).responseSessions(new ArrayList<>()).build();
        draft.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(draft).questionId("classic_self_" + lens + "_01").answerValue(3).build()).toList()));
        TenSignal tenSignal = tenSignalRepository.saveAndFlush(draft);
        tenSignal.setResultSnapshot(scoringEngineService.calculateSelfResult(tenSignal));
        for (int participant = 0; participant < 100; participant++) {
            ResponseSession session = ResponseSession.builder().seenly(tenSignal)
                .fingerprintHash("query-device-" + participant).responses(new ArrayList<>()).build();
            int answer = 1 + participant % 5;
            session.setResponses(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> FriendResponse.builder()
                .responseSession(session).questionId("classic_friend_" + lens + "_01")
                .answerValue(answer).build()).toList()));
            entityManager.persist(session);
        }
        entityManager.flush();
        String slug = tenSignal.getPublicSlug();
        entityManager.clear();

        SessionFactory sessionFactory = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class);
        sessionFactory.getStatistics().clear();
        PublicProfileDto profile = tenSignalService.getPublicDashboard(slug, null, "query-budget-token");

        assertThat(profile.getFriendAverages()).hasSize(10).allSatisfy((lens, average) ->
            assertThat(average).isEqualTo(3.0));
        assertThat(sessionFactory.getStatistics().getPrepareStatementCount()).isLessThanOrEqualTo(3);
    }

    @Test
    void ownerResponseHistoryPaginationExecutesBoundedQueriesWithoutCartesianProduct() {
        User user = userRepository.save(User.builder().email("history-budget@example.com").isPremium(true).build());
        String rawOwnerToken = "history-owner-token";
        TenSignal draft = TenSignal.builder().user(user).email(user.getEmail()).displayName("History Budget")
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken(rawOwnerToken))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600)).responseCount(15)
            .selfAnswers(new ArrayList<>()).responseSessions(new ArrayList<>()).build();
        draft.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(draft).questionId("classic_self_" + lens + "_01").answerValue(4).build()).toList()));
        TenSignal tenSignal = tenSignalRepository.saveAndFlush(draft);

        for (int i = 0; i < 15; i++) {
            ResponseSession session = ResponseSession.builder()
                .seenly(tenSignal)
                .fingerprintHash("history-device-" + i)
                .nickname("Respondent-" + i)
                .responses(new ArrayList<>())
                .friendTimeAnalytics(new java.util.HashMap<>())
                .build();
            int answer = 1 + (i % 5);
            session.setResponses(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> FriendResponse.builder()
                .responseSession(session).questionId("classic_friend_" + lens + "_01")
                .answerValue(answer).build()).toList()));
            for (String lens : AppConstants.LENSES) {
                session.getFriendTimeAnalytics().put(lens, 1200 + i * 10);
            }
            entityManager.persist(session);
        }
        entityManager.flush();
        entityManager.clear();

        SessionFactory sessionFactory = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class);
        sessionFactory.getStatistics().clear();

        // Page 1: 5 items
        com.tensignal.backend.dto.OwnerResponseHistoryPageDto page1 =
            tenSignalService.getOwnerResponseHistory(rawOwnerToken, null, 5);

        assertThat(page1.items()).hasSize(5);
        assertThat(page1.hasMore()).isTrue();
        assertThat(page1.nextCursor()).isNotNull();
        // Bounded queries: 1 for token auth, 1 for IDs, 1 for sessions+responses entity graph, 1 for batched friendTimeAnalytics
        assertThat(sessionFactory.getStatistics().getPrepareStatementCount()).isLessThanOrEqualTo(4);

        // Verify content integrity
        page1.items().forEach(item -> {
            assertThat(item.getSignals()).hasSize(10);
            assertThat(item.getFriendTimeAnalytics()).hasSize(10);
        });

        // Page 2: with cursor
        sessionFactory.getStatistics().clear();
        com.tensignal.backend.dto.OwnerResponseHistoryPageDto page2 =
            tenSignalService.getOwnerResponseHistory(rawOwnerToken, page1.nextCursor(), 5);

        assertThat(page2.items()).hasSize(5);
        assertThat(page2.hasMore()).isTrue();
        assertThat(sessionFactory.getStatistics().getPrepareStatementCount()).isLessThanOrEqualTo(4);

        // Ensure disjoint sets across pages
        java.util.Set<java.util.UUID> page1Ids = page1.items().stream()
            .map(com.tensignal.backend.dto.ResponseSessionDto::getId).collect(java.util.stream.Collectors.toSet());
        java.util.Set<java.util.UUID> page2Ids = page2.items().stream()
            .map(com.tensignal.backend.dto.ResponseSessionDto::getId).collect(java.util.stream.Collectors.toSet());

        assertThat(page1Ids).hasSize(5);
        assertThat(page2Ids).hasSize(5);
        assertThat(page1Ids).doesNotContainAnyElementsOf(page2Ids);
    }

    @Test
    void ownerResponseHistoryEmptyReturnsCleanSlice() {
        User user = userRepository.save(User.builder().email("empty-history@example.com").isPremium(true).build());
        String rawOwnerToken = "empty-history-token";
        TenSignal draft = TenSignal.builder().user(user).email(user.getEmail()).displayName("Empty History")
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken(rawOwnerToken))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600)).responseCount(0)
            .selfAnswers(new ArrayList<>()).responseSessions(new ArrayList<>()).build();
        tenSignalRepository.saveAndFlush(draft);

        com.tensignal.backend.dto.OwnerResponseHistoryPageDto emptyPage =
            tenSignalService.getOwnerResponseHistory(rawOwnerToken, null, 10);

        assertThat(emptyPage.items()).isEmpty();
        assertThat(emptyPage.hasMore()).isFalse();
        assertThat(emptyPage.nextCursor()).isNull();
    }
}
