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
}
