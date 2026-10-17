package com.tensignal.backend;

import com.tensignal.backend.dto.OwnerDashboardDto;
import com.tensignal.backend.entity.FriendResponse;
import com.tensignal.backend.entity.ResponseSession;
import com.tensignal.backend.entity.ResultSnapshot;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.service.SnapshotMapperService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentEntitlementProjectionTest {
    private final SnapshotMapperService mapper = new SnapshotMapperService();

    @Test
    void premiumOnlyAnalyticsAreNotReturnedUntilServerEntitlementIsActive() {
        User user = User.builder().isPremium(false).build();
        TenSignal tenSignal = TenSignal.builder()
            .user(user)
            .displayName("Projection Owner")
            .publicSlug("projection-owner")
            .ownerTokenHash("hash")
            .responseCount(3)
            .totalProfileClicks(42)
            .build();
        ResponseSession session = ResponseSession.builder()
            .seenly(tenSignal)
            .fingerprintHash("pseudonymous")
            .createdAt(LocalDateTime.now())
            .friendTimeAnalytics(Map.of("samimiyet", 900))
            .build();
        session.setResponses(List.of(FriendResponse.builder()
            .responseSession(session)
            .questionId("classic_friend_samimiyet_01")
            .answerValue(4)
            .build()));
        tenSignal.setResponseSessions(List.of(session));
        ResultSnapshot snapshot = ResultSnapshot.builder()
            .seenly(tenSignal)
            .selfSignatureId("self")
            .selfFamilyId("self-family")
            .outsideSignatureId("outside")
            .outsideFamilyId("outside-family")
            .build();

        OwnerDashboardDto free = mapper.toOwnerDto(snapshot);
        assertThat(free.getFriendAverages()).containsEntry("samimiyet", 4.0);
        assertThat(free.getFriendTimeAnalytics()).isNull();
        assertThat(free.getResponseSessions()).isNull();
        assertThat(free.getTotalProfileClicks()).isZero();

        user.setIsPremium(true);
        OwnerDashboardDto premium = mapper.toOwnerDto(snapshot);
        assertThat(premium.getFriendTimeAnalytics()).containsEntry("samimiyet", 900.0);
        // Detailed premium history is intentionally fetched from the bounded owner-history endpoint.
        assertThat(premium.getResponseSessions()).isEmpty();
        assertThat(premium.getTotalProfileClicks()).isEqualTo(42);
    }

    @Test
    void publicProfileAcceptsResponsesCorrectlyAcrossFreePlusAndExtraCapacity() {
        User user = User.builder().isPremium(false).baseFormCapacity(3).purchasedExtraCapacity(0).build();
        TenSignal tenSignal = TenSignal.builder()
            .user(user)
            .displayName("Quota User")
            .publicSlug("quota-user-1")
            .ownerTokenHash("hash")
            .responseCount(2)
            .isCapped(false)
            .build();
        ResultSnapshot snapshot = ResultSnapshot.builder().seenly(tenSignal).build();

        // 1. Free tier with 2 responses (< 3): accepting responses
        assertThat(tenSignal.isCapped()).isFalse();
        assertThat(mapper.toPublicDto(snapshot).isAcceptingResponses()).isTrue();

        // 2. Free tier reaches 3 responses (>= 3): capped
        tenSignal.setResponseCount(3);
        tenSignal.setCapped(true);
        assertThat(tenSignal.isCapped()).isTrue();
        assertThat(mapper.toPublicDto(snapshot).isAcceptingResponses()).isFalse();

        // 3. User buys TenSignal Plus: even if old isCapped flag was true in DB, accepting responses is true
        user.setIsPremium(true);
        assertThat(tenSignal.isCapped()).isFalse();
        assertThat(mapper.toPublicDto(snapshot).isAcceptingResponses()).isTrue();

        // 4. User reverts to free but has purchased extra capacity pack (+5 -> total 8):
        user.setIsPremium(false);
        user.setPurchasedExtraCapacity(5);
        // responseCount is 3, capacity is 8
        assertThat(tenSignal.isCapped()).isFalse();
        assertThat(mapper.toPublicDto(snapshot).isAcceptingResponses()).isTrue();

        // 5. User reaches 8 responses (>= 8): capped
        tenSignal.setResponseCount(8);
        assertThat(tenSignal.isCapped()).isTrue();
        assertThat(mapper.toPublicDto(snapshot).isAcceptingResponses()).isFalse();
    }

    @Test
    void responseSessionHistoryMasksSignalsAndTimesForFreeUsersWhilePreservingTeaserMetadata() {
        ResponseSession session = ResponseSession.builder()
            .nickname("Ali")
            .createdAt(LocalDateTime.now())
            .friendTimeAnalytics(Map.of("samimiyet", 1200))
            .build();
        session.setResponses(List.of(FriendResponse.builder()
            .responseSession(session)
            .questionId("classic_friend_samimiyet_01")
            .answerValue(4)
            .build()));

        Map<String, Integer> selfAnswers = Map.of("samimiyet", 4);

        // Free user session DTO
        var freeSessionDto = mapper.toSessionDto(session, selfAnswers, false);
        assertThat(freeSessionDto.getNickname()).isEqualTo("Ali");
        assertThat(freeSessionDto.getCompletedAt()).isNotNull();
        assertThat(freeSessionDto.getReaderType()).isNotNull();
        assertThat(freeSessionDto.getAccuracy()).isEqualTo(100.0);
        assertThat(freeSessionDto.getSignals()).isEmpty();
        assertThat(freeSessionDto.getFriendTimeAnalytics()).isEmpty();

        // Plus user session DTO
        var plusSessionDto = mapper.toSessionDto(session, selfAnswers, true);
        assertThat(plusSessionDto.getNickname()).isEqualTo("Ali");
        assertThat(plusSessionDto.getSignals()).containsEntry("samimiyet", 4);
        assertThat(plusSessionDto.getFriendTimeAnalytics()).containsEntry("samimiyet", 1200);
    }
}
