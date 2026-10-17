package com.tensignal.backend;

import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.dto.FriendResponseInput;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.SelfAnswer;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.exception.QuotaExceededException;
import com.tensignal.backend.exception.DuplicateResponseException;
import com.tensignal.backend.repository.ResponseSessionRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.service.FriendResponseService;
import com.tensignal.backend.service.ScoringEngineService;
import com.tensignal.backend.service.TokenHashingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@ActiveProfiles("test")
class ParticipantCapacityConcurrencyIntegrationTest {

    @Autowired TransactionTemplate transactions;
    @Autowired UserRepository userRepository;
    @Autowired TenSignalRepository tenSignalRepository;
    @Autowired ResponseSessionRepository responseSessionRepository;
    @Autowired FriendResponseService friendResponseService;
    @Autowired ScoringEngineService scoringEngineService;
    @Autowired TokenHashingService tokenHashingService;

    @Test
    @Timeout(15)
    void twoConcurrentSubmissionsCannotConsumeTheSameLastCapacitySlot() throws Exception {
        String slug = transactions.execute(status -> createProfile(1, "capacity-one@example.com"));
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<String> first = pool.submit(() -> submitAfterBarrier(slug, "concurrent-device-one", ready, start));
            Future<String> second = pool.submit(() -> submitAfterBarrier(slug, "concurrent-device-two", ready, start));
            ready.await();
            start.countDown();

            assertThat(java.util.List.of(first.get(), second.get())).containsExactlyInAnyOrder("accepted", "capacity-rejected");
        } finally {
            pool.shutdownNow();
        }

        transactions.executeWithoutResult(status -> {
            TenSignal persisted = tenSignalRepository.findByPublicSlug(slug).orElseThrow();
            assertThat(persisted.getResponseCount()).isEqualTo(1);
            assertThat(persisted.isCapped()).isTrue();
            assertThat(responseSessionRepository.countBySeenlyId(persisted.getId())).isEqualTo(1);
        });
    }

    @Test
    @Timeout(15)
    void concurrentReplayWithTheSameSignalAcceptsExactlyOneResponse() throws Exception {
        String slug = transactions.execute(status -> createProfile(3, "duplicate-race@example.com"));
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<String> first = pool.submit(() -> replayAfterBarrier(slug, ready, start));
            Future<String> second = pool.submit(() -> replayAfterBarrier(slug, ready, start));
            ready.await();
            start.countDown();
            assertThat(java.util.List.of(first.get(), second.get()))
                .containsExactlyInAnyOrder("accepted", "duplicate-rejected");
        } finally {
            pool.shutdownNow();
        }

        transactions.executeWithoutResult(status -> {
            TenSignal persisted = tenSignalRepository.findByPublicSlug(slug).orElseThrow();
            assertThat(persisted.getResponseCount()).isEqualTo(1);
            assertThat(responseSessionRepository.countBySeenlyId(persisted.getId())).isEqualTo(1);
        });
    }

    private String submitAfterBarrier(String slug, String signal, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        try {
            start.await();
            friendResponseService.processFriendSubmission(slug, null, "198.51.100.90", request(signal));
            return "accepted";
        } catch (QuotaExceededException ex) {
            return "capacity-rejected";
        }
    }

    private String replayAfterBarrier(String slug, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        try {
            start.await();
            friendResponseService.processFriendSubmission(slug, null, "203.0.113.45", request("same-racing-signal"));
            return "accepted";
        } catch (DuplicateResponseException ex) {
            return "duplicate-rejected";
        }
    }

    private String createProfile(int capacity, String email) {
        User user = userRepository.save(User.builder()
            .email(email)
            .emailVerified(true)
            .isPremium(false)
            .baseFormCapacity(capacity)
            .purchasedExtraCapacity(0)
            .build());
        String token = tokenHashingService.generateRawToken();
        TenSignal tenSignal = TenSignal.builder()
            .user(user)
            .displayName("Capacity One")
            .email(user.getEmail())
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken(token))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600))
            .build();
        tenSignal.setSelfAnswers(new ArrayList<>(AppConstants.LENSES.stream().map(lens -> SelfAnswer.builder()
            .seenly(tenSignal).questionId("classic_self_" + lens + "_01").answerValue(3).build()).toList()));
        tenSignalRepository.saveAndFlush(tenSignal);
        tenSignal.setResultSnapshot(scoringEngineService.calculateSelfResult(tenSignal));
        return tenSignal.getPublicSlug();
    }

    private FriendResponseInput request(String signal) {
        return FriendResponseInput.builder()
            .nickname("Concurrent participant")
            .fingerprintHash(signal)
            .friendResponses(AppConstants.LENSES.stream().map(lens -> FriendResponseInput.AnswerInput.builder()
                .questionId("classic_friend_" + lens + "_01").answerValue(3).build()).toList())
            .friendTimeAnalytics(Map.of("samimiyet", 250))
            .build();
    }
}
