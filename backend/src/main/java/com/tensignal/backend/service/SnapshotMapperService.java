package com.tensignal.backend.service;

import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.dto.OwnerDashboardDto;
import com.tensignal.backend.dto.PublicProfileDto;
import com.tensignal.backend.dto.ResponseSessionDto;
import com.tensignal.backend.entity.FriendResponse;
import com.tensignal.backend.entity.ResponseSession;
import com.tensignal.backend.entity.ResultSnapshot;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.SelfAnswer;
import org.springframework.stereotype.Service;
import com.tensignal.backend.repository.FriendResponseRepository;
import com.tensignal.backend.repository.ResponseSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SnapshotMapperService {
    private final FriendResponseRepository friendResponseRepository;
    private final ResponseSessionRepository responseSessionRepository;

    @Autowired
    public SnapshotMapperService(FriendResponseRepository friendResponseRepository,
                                 ResponseSessionRepository responseSessionRepository) {
        this.friendResponseRepository = friendResponseRepository;
        this.responseSessionRepository = responseSessionRepository;
    }

    /** Used only by the legacy single-session DTO constructor, which performs no repository access. */
    public SnapshotMapperService() {
        this.friendResponseRepository = null;
        this.responseSessionRepository = null;
    }

    /** Maps the complete owner-only dashboard representation. */
    public OwnerDashboardDto toOwnerDto(ResultSnapshot snapshot) {
        TenSignal tenSignal = requireTenSignal(snapshot);
        OwnerDashboardDto dto = new OwnerDashboardDto();

        dto.setScoringVersion(snapshot.getScoringVersion());
        dto.setSelfSignatureId(snapshot.getSelfSignatureId());
        dto.setSelfFamilyId(snapshot.getSelfFamilyId());
        dto.setConfidenceBand(snapshot.getConfidenceBand());
        dto.setResponseCount(tenSignal.getResponseCount());
        dto.setTotalProfileClicks(tenSignal.getIsPremium() ? tenSignal.getTotalProfileClicks() : 0);
        dto.setTotalResponders(tenSignal.getResponseCount());
        dto.setPublicSlug(tenSignal.getPublicSlug());
        dto.setDisplayName(tenSignal.getDisplayName());
        dto.setEmail(tenSignal.getEmail());
        dto.setAvatar(tenSignal.getAvatar());
        dto.setPreferredLocale(tenSignal.getPreferredLocale());
        dto.setIsPremium(tenSignal.getIsPremium());
        dto.setCurrentResponseCount(tenSignal.getResponseCount());
        dto.setMaxResponseLimit(tenSignal.getIsPremium()
            ? -1
            : tenSignal.getBaseFormCapacity() + tenSignal.getPurchasedExtraCapacity());

        applyNameChangeState(dto, tenSignal);
        applyThresholdProtectedOwnerResults(dto, snapshot, tenSignal.getResponseCount());

        Map<String, Integer> selfAnswersByLens = new HashMap<>();
        dto.setSelfAverages(calculateSelfAverages(tenSignal, selfAnswersByLens));

        if (tenSignal.getResponseCount() >= AppConstants.MIN_RESPONSES_FOR_OUTSIDE) {
            dto.setFriendAverages(calculateFriendAverages(tenSignal));
            if (tenSignal.getIsPremium()) {
                dto.setFriendTimeAnalytics(calculateFriendTimeAverages(tenSignal));
                dto.setResponseSessions(List.of());
            }
        }
        return dto;
    }

    /**
     * Fail-closed overload: unauthenticated callers are locked by default with COMPLETE_TEST_REQUIRED.
     */
    public PublicProfileDto toPublicDto(ResultSnapshot snapshot) {
        return toPublicDto(snapshot, false, "COMPLETE_TEST_REQUIRED");
    }

    /**
     * Maps public profile with explicit outside perception authorization and lock reason.
     * Outside aggregates are only included if outsidePerceptionAllowed is true AND threshold is met.
     */
    public PublicProfileDto toPublicDto(ResultSnapshot snapshot, boolean outsidePerceptionAllowed, String lockReason) {
        TenSignal tenSignal = requireTenSignal(snapshot);
        int responseCount = tenSignal.getResponseCount();
        boolean thresholdReached = responseCount >= AppConstants.MIN_RESPONSES_FOR_OUTSIDE;
        int capacity = tenSignal.getBaseFormCapacity() + tenSignal.getPurchasedExtraCapacity();
        boolean acceptingResponses = tenSignal.getIsPremium()
            || (!tenSignal.isCapped() && responseCount < capacity);

        // Defense-in-depth: both authorization and response threshold are strictly required
        boolean allowed = outsidePerceptionAllowed && thresholdReached;
        String effectiveReason = allowed ? null : (lockReason != null ? lockReason : "COMPLETE_TEST_REQUIRED");

        PublicProfileDto dto = PublicProfileDto.builder()
            .publicSlug(tenSignal.getPublicSlug())
            .displayName(tenSignal.getDisplayName())
            .avatar(tenSignal.getAvatar())
            .responseCount(responseCount)
            .acceptingResponses(acceptingResponses)
            .confidenceBand(snapshot.getConfidenceBand())
            .outsidePerceptionLocked(!allowed)
            .outsidePerceptionLockReason(effectiveReason)
            .build();

        if (allowed) {
            dto.setOutsideSignatureId(snapshot.getOutsideSignatureId());
            dto.setOutsideFamilyId(snapshot.getOutsideFamilyId());
            dto.setFriendAverages(calculateFriendAverages(tenSignal));
        }
        return dto;
    }

    private TenSignal requireTenSignal(ResultSnapshot snapshot) {
        if (snapshot == null) throw new IllegalArgumentException("Snapshot cannot be null");
        TenSignal tenSignal = snapshot.getSeenly();
        if (tenSignal == null) {
            throw new IllegalArgumentException("Snapshot must be associated with a valid TenSignal profile");
        }
        return tenSignal;
    }

    private void applyNameChangeState(OwnerDashboardDto dto, TenSignal tenSignal) {
        LocalDateTime lastChanged = tenSignal.getLastNameChangedAt();
        dto.setLastNameChangedAt(lastChanged);
        if (lastChanged == null) {
            dto.setNextAllowedNameChangeDate(null);
            dto.setNameChangeDaysRemaining(0L);
            return;
        }

        LocalDateTime nextAllowed = lastChanged.plusDays(AppConstants.NAME_CHANGE_COOLDOWN_DAYS);
        if (LocalDateTime.now().isBefore(nextAllowed)) {
            dto.setNextAllowedNameChangeDate(nextAllowed);
            dto.setNameChangeDaysRemaining(ChronoUnit.DAYS.between(LocalDateTime.now(), nextAllowed) + 1);
        } else {
            dto.setNextAllowedNameChangeDate(null);
            dto.setNameChangeDaysRemaining(0L);
        }
    }

    private void applyThresholdProtectedOwnerResults(OwnerDashboardDto dto, ResultSnapshot snapshot, int responseCount) {
        if (responseCount >= AppConstants.MIN_RESPONSES_FOR_OUTSIDE) {
            dto.setOutsideSignatureId(snapshot.getOutsideSignatureId());
            dto.setOutsideFamilyId(snapshot.getOutsideFamilyId());
            dto.setGapPatternId(snapshot.getGapPatternId());
            dto.setGapStrength(snapshot.getGapStrength());
        }
    }

    private Map<String, Double> calculateSelfAverages(TenSignal tenSignal, Map<String, Integer> selfAnswersByLens) {
        Map<String, List<Integer>> values = new HashMap<>();
        if (tenSignal.getSelfAnswers() != null) {
            for (SelfAnswer answer : tenSignal.getSelfAnswers()) {
                String lens = extractLensFromQuestionId(answer.getQuestionId());
                values.computeIfAbsent(lens, ignored -> new ArrayList<>()).add(answer.getAnswerValue());
                selfAnswersByLens.put(lens, answer.getAnswerValue());
            }
        }
        return average(values);
    }

    private Map<String, Double> calculateFriendAverages(TenSignal tenSignal) {
        Map<String, Double> values = new HashMap<>();
        if (friendResponseRepository == null) {
            Map<String, List<Integer>> fallback = new HashMap<>();
            if (tenSignal.getResponseSessions() != null) for (ResponseSession session : tenSignal.getResponseSessions()) {
                if (session.getResponses() != null) for (FriendResponse response : session.getResponses()) {
                    fallback.computeIfAbsent(extractLensFromQuestionId(response.getQuestionId()), ignored -> new ArrayList<>())
                        .add(response.getAnswerValue());
                }
            }
            return average(fallback);
        }
        for (FriendResponseRepository.AnswerAverage average
                : friendResponseRepository.findAnswerAveragesBySeenlyId(tenSignal.getId())) {
            values.put(extractLensFromQuestionId(average.getQuestionId()), average.getAverageValue());
        }
        return values;
    }

    private Map<String, Double> calculateFriendTimeAverages(TenSignal tenSignal) {
        Map<String, Double> values = new HashMap<>();
        if (responseSessionRepository != null) {
            for (ResponseSessionRepository.TimeAverage average
                    : responseSessionRepository.findTimeAveragesBySeenlyId(tenSignal.getId())) {
                values.put(average.getSignalKey(), average.getAverageValue());
            }
            return values;
        }
        Map<String, List<Integer>> fallback = new HashMap<>();
        if (tenSignal.getResponseSessions() != null) for (ResponseSession session : tenSignal.getResponseSessions()) {
            if (session.getFriendTimeAnalytics() != null) for (Map.Entry<String, Integer> entry : session.getFriendTimeAnalytics().entrySet()) {
                fallback.computeIfAbsent(entry.getKey(), ignored -> new ArrayList<>()).add(entry.getValue());
            }
        }
        return average(fallback);
    }

    private void collectOwnerResponseData(TenSignal tenSignal,
                                          Map<String, Integer> selfAnswersByLens,
                                          Map<String, Double> friendAverages,
                                          Map<String, Double> friendTimeAnalytics,
                                          List<ResponseSessionDto> sessions) {
        Map<String, List<Integer>> friendValues = new HashMap<>();
        Map<String, List<Integer>> timeValues = new HashMap<>();
        if (tenSignal.getResponseSessions() == null) return;
        for (ResponseSession session : tenSignal.getResponseSessions()) {
            sessions.add(toSessionDto(session, selfAnswersByLens));
            if (session.getResponses() != null) {
                for (FriendResponse response : session.getResponses()) {
                    String lens = extractLensFromQuestionId(response.getQuestionId());
                    friendValues.computeIfAbsent(lens, ignored -> new ArrayList<>()).add(response.getAnswerValue());
                }
            }
            if (session.getFriendTimeAnalytics() != null) {
                for (Map.Entry<String, Integer> entry : session.getFriendTimeAnalytics().entrySet()) {
                    timeValues.computeIfAbsent(entry.getKey(), ignored -> new ArrayList<>()).add(entry.getValue());
                }
            }
        }

        friendAverages.putAll(average(friendValues));
        friendTimeAnalytics.putAll(average(timeValues));
        sessions.sort((first, second) -> second.getCompletedAt().compareTo(first.getCompletedAt()));
    }

    private Map<String, Double> average(Map<String, List<Integer>> values) {
        Map<String, Double> averages = new HashMap<>();
        for (Map.Entry<String, List<Integer>> entry : values.entrySet()) {
            double sum = entry.getValue().stream().mapToInt(Integer::intValue).sum();
            averages.put(entry.getKey(), sum / entry.getValue().size());
        }
        return averages;
    }

    /** Maps a response session for the authenticated owner's private response history. */
    public ResponseSessionDto toSessionDto(ResponseSession session, Map<String, Integer> selfAnswersMap) {
        return toSessionDto(session, selfAnswersMap, true);
    }

    /**
     * Maps a response session for the owner. If isPremium is false, detailed question signals
     * and response times are masked to preserve the monetization paywall and respondent privacy.
     */
    public ResponseSessionDto toSessionDto(ResponseSession session, Map<String, Integer> selfAnswersMap, boolean isPremium) {
        if (session == null) throw new IllegalArgumentException("Session cannot be null");

        ResponseSessionDto dto = new ResponseSessionDto();
        dto.setId(session.getId());
        String nickname = session.getNickname();
        dto.setNickname(nickname != null && !nickname.isBlank() ? nickname.trim() : "unknown_person");
        if (session.getCreatedAt() != null) {
            dto.setCompletedAt(ZonedDateTime.of(session.getCreatedAt(), ZoneId.systemDefault()));
        }

        Map<String, Integer> signals = new HashMap<>();
        double totalDiff = 0.0;
        int count = 0;
        if (session.getResponses() != null) {
            for (FriendResponse response : session.getResponses()) {
                String lens = extractLensFromQuestionId(response.getQuestionId());
                signals.put(lens, response.getAnswerValue());
                if (selfAnswersMap != null && selfAnswersMap.containsKey(lens)) {
                    totalDiff += Math.abs(response.getAnswerValue() - selfAnswersMap.get(lens));
                    count++;
                }
            }
        }

        double accuracy = count > 0 ? 100.0 * (1.0 - totalDiff / (count * 4.0)) : 0.0;
        dto.setAccuracy(accuracy);
        dto.setReaderType(getReaderStyleForAccuracy(accuracy));

        if (isPremium) {
            dto.setSignals(signals);
            dto.setFriendTimeAnalytics(session.getFriendTimeAnalytics() != null
                ? new HashMap<>(session.getFriendTimeAnalytics())
                : new HashMap<>());
        } else {
            dto.setSignals(Map.of());
            dto.setFriendTimeAnalytics(Map.of());
        }
        return dto;
    }

    public static String extractLensFromQuestionId(String questionId) {
        if (questionId == null) return "samimiyet";
        String lower = questionId.toLowerCase();
        for (String lens : AppConstants.LENSES) {
            if (lower.contains(lens)) return lens;
        }
        String[] parts = questionId.split("_");
        return parts.length >= 3 ? parts[2].toLowerCase() : "samimiyet";
    }

    public static String getReaderStyleForAccuracy(double accuracy) {
        if (accuracy >= 90.0) return "telepathic_reader";
        if (accuracy >= 75.0) return "clear_reader";
        if (accuracy >= 55.0) return "balanced_reader";
        if (accuracy >= 35.0) return "casual_explorer";
        return "social_stranger";
    }
}
