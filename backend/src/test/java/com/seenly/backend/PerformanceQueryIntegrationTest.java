package com.seenly.backend;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.dto.PublicProfileDto;
import com.seenly.backend.entity.*;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import com.seenly.backend.service.ScoringEngineService;
import com.seenly.backend.service.SeenlyService;
import com.seenly.backend.service.TokenHashingService;
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
    @Autowired SeenlyRepository seenlyRepository;
    @Autowired SeenlyService seenlyService;
    @Autowired ScoringEngineService scoringEngineService;
    @Autowired TokenHashingService tokenHashingService;

    @Test
    void publicAggregateQueryCountDoesNotGrowWithParticipantHistory() {
        User user = userRepository.save(User.builder().email("query-budget@example.com").isPremium(true).build());
        Seenly draft = Seenly.builder().user(user).email(user.getEmail()).displayName("Query Budget")
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken("query-budget-token"))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600)).responseCount(100)
            .selfAnswers(new ArrayList<>()).responseSessions(new ArrayList<>()).build();
        draft.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(draft).questionId("classic_self_" + lens + "_01").answerValue(3).build()).toList()));
        Seenly seenly = seenlyRepository.saveAndFlush(draft);
        seenly.setResultSnapshot(scoringEngineService.calculateSelfResult(seenly));
        for (int participant = 0; participant < 100; participant++) {
            ResponseSession session = ResponseSession.builder().seenly(seenly)
                .fingerprintHash("query-device-" + participant).responses(new ArrayList<>()).build();
            int answer = 1 + participant % 5;
            session.setResponses(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> FriendResponse.builder()
                .responseSession(session).questionId("classic_friend_" + lens + "_01")
                .answerValue(answer).build()).toList()));
            entityManager.persist(session);
        }
        entityManager.flush();
        String slug = seenly.getPublicSlug();
        entityManager.clear();

        SessionFactory sessionFactory = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class);
        sessionFactory.getStatistics().clear();
        PublicProfileDto profile = seenlyService.getPublicDashboard(slug, null, "query-budget-token");

        assertThat(profile.getFriendAverages()).hasSize(10).allSatisfy((lens, average) ->
            assertThat(average).isEqualTo(3.0));
        assertThat(sessionFactory.getStatistics().getPrepareStatementCount()).isLessThanOrEqualTo(3);
    }
}
