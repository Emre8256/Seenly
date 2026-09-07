package com.seenly.backend;

import com.seenly.backend.dto.OwnerDashboardDto;
import com.seenly.backend.entity.FriendResponse;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.entity.ResultSnapshot;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import com.seenly.backend.service.SnapshotMapperService;
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
        Seenly seenly = Seenly.builder()
            .user(user)
            .displayName("Projection Owner")
            .publicSlug("projection-owner")
            .ownerTokenHash("hash")
            .responseCount(3)
            .totalProfileClicks(42)
            .build();
        ResponseSession session = ResponseSession.builder()
            .seenly(seenly)
            .fingerprintHash("pseudonymous")
            .createdAt(LocalDateTime.now())
            .friendTimeAnalytics(Map.of("samimiyet", 900))
            .build();
        session.setResponses(List.of(FriendResponse.builder()
            .responseSession(session)
            .questionId("classic_friend_samimiyet_01")
            .answerValue(4)
            .build()));
        seenly.setResponseSessions(List.of(session));
        ResultSnapshot snapshot = ResultSnapshot.builder()
            .seenly(seenly)
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
}
