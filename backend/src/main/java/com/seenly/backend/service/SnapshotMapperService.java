package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.dto.OwnerDashboardDto;
import com.seenly.backend.dto.PublicProfileDto;
import com.seenly.backend.dto.ResponseSessionDto;
import com.seenly.backend.entity.FriendResponse;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.entity.ResultSnapshot;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.SelfAnswer;
import org.springframework.stereotype.Service;
import com.seenly.backend.repository.FriendResponseRepository;
import com.seenly.backend.repository.ResponseSessionRepository;
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
        Seenly seenly = requireSeenly(snapshot);
        OwnerDashboardDto dto = new OwnerDashboardDto();

        dto.setScoringVersion(snapshot.getScoringVersion());
        dto.setSelfSignatureId(snapshot.getSelfSignatureId());
        dto.setSelfFamilyId(snapshot.getSelfFamilyId());
        dto.setConfidenceBand(snapshot.getConfidenceBand());
        dto.setResponseCount(seenly.getResponseCount());
        dto.setTotalProfileClicks(seenly.getIsPremium() ? seenly.getTotalProfileClicks() : 0);
        dto.setTotalResponders(seenly.getResponseCount());
        dto.setPublicSlug(seenly.getPublicSlug());
        dto.setDisplayName(seenly.getDisplayName());
        dto.setEmail(seenly.getEmail());
        dto.setAvatar(seenly.getAvatar());
        dto.setIsPremium(seenly.getIsPremium());
        dto.setCurrentResponseCount(seenly.getResponseCount());
        dto.setMaxResponseLimit(seenly.getIsPremium()
            ? -1
            : seenly.getBaseFormCapacity() + seenly.getPurchasedExtraCapacity());

        applyNameChangeState(dto, seenly);
        applyThresholdProtectedOwnerResults(dto, snapshot, seenly.getResponseCount());

        Map<String, Integer> selfAnswersByLens = new HashMap<>();
        dto.setSelfAverages(calculateSelfAverages(seenly, selfAnswersByLens));

        if (seenly.getResponseCount() >= AppConstants.MIN_RESPONSES_FOR_OUTSIDE) {
            dto.setFriendAverages(calculateFriendAverages(seenly));
            if (seenly.getIsPremium()) {
                dto.setFriendTimeAnalytics(calculateFriendTimeAverages(seenly));
                dto.setResponseSessions(List.of());
            }
        }
        return dto;
    }

    /**
     * Maps only fields intentionally safe for an unauthenticated public profile.
     * Anonymous aggregates are absent until the backend anonymity threshold is met.
     */
    public PublicProfileDto toPublicDto(ResultSnapshot snapshot) {
        Seenly seenly = requireSeenly(snapshot);
        int responseCount = seenly.getResponseCount();
        boolean thresholdReached = responseCount >= AppConstants.MIN_RESPONSES_FOR_OUTSIDE;
        int capacity = seenly.getBaseFormCapacity() + seenly.getPurchasedExtraCapacity();
        boolean acceptingResponses = !seenly.isCapped()
            && (seenly.getIsPremium() || responseCount < capacity);

        PublicProfileDto dto = PublicProfileDto.builder()
            .publicSlug(seenly.getPublicSlug())
            .displayName(seenly.getDisplayName())
            .avatar(seenly.getAvatar())
            .responseCount(responseCount)
            .acceptingResponses(acceptingResponses)
            .confidenceBand(snapshot.getConfidenceBand())
            .build();

        if (thresholdReached) {
            dto.setOutsideSignatureId(snapshot.getOutsideSignatureId());
            dto.setOutsideFamilyId(snapshot.getOutsideFamilyId());
            dto.setFriendAverages(calculateFriendAverages(seenly));
        }
        return dto;
    }

    private Seenly requireSeenly(ResultSnapshot snapshot) {
        if (snapshot == null) throw new IllegalArgumentException("Snapshot cannot be null");
        Seenly seenly = snapshot.getSeenly();
        if (seenly == null) {
            throw new IllegalArgumentException("Snapshot must be associated with a valid Seenly profile");
        }
        return seenly;
    }

    private void applyNameChangeState(OwnerDashboardDto dto, Seenly seenly) {
        LocalDateTime lastChanged = seenly.getLastNameChangedAt();
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

    private Map<String, Double> calculateSelfAverages(Seenly seenly, Map<String, Integer> selfAnswersByLens) {
        Map<String, List<Integer>> values = new HashMap<>();
        if (seenly.getSelfAnswers() != null) {
            for (SelfAnswer answer : seenly.getSelfAnswers()) {
                String lens = extractLensFromQuestionId(answer.getQuestionId());
                values.computeIfAbsent(lens, ignored -> new ArrayList<>()).add(answer.getAnswerValue());
                selfAnswersByLens.put(lens, answer.getAnswerValue());
            }
        }
        return average(values);
    }

    private Map<String, Double> calculateFriendAverages(Seenly seenly) {
        Map<String, Double> values = new HashMap<>();
        if (friendResponseRepository == null) {
            Map<String, List<Integer>> fallback = new HashMap<>();
            if (seenly.getResponseSessions() != null) for (ResponseSession session : seenly.getResponseSessions()) {
                if (session.getResponses() != null) for (FriendResponse response : session.getResponses()) {
                    fallback.computeIfAbsent(extractLensFromQuestionId(response.getQuestionId()), ignored -> new ArrayList<>())
                        .add(response.getAnswerValue());
                }
            }
            return average(fallback);
        }
        for (FriendResponseRepository.AnswerAverage average
                : friendResponseRepository.findAnswerAveragesBySeenlyId(seenly.getId())) {
            values.put(extractLensFromQuestionId(average.getQuestionId()), average.getAverageValue());
        }
        return values;
    }

    private Map<String, Double> calculateFriendTimeAverages(Seenly seenly) {
        Map<String, Double> values = new HashMap<>();
        if (responseSessionRepository != null) {
            for (ResponseSessionRepository.TimeAverage average
                    : responseSessionRepository.findTimeAveragesBySeenlyId(seenly.getId())) {
                values.put(average.getSignalKey(), average.getAverageValue());
            }
            return values;
        }
        Map<String, List<Integer>> fallback = new HashMap<>();
        if (seenly.getResponseSessions() != null) for (ResponseSession session : seenly.getResponseSessions()) {
            if (session.getFriendTimeAnalytics() != null) for (Map.Entry<String, Integer> entry : session.getFriendTimeAnalytics().entrySet()) {
                fallback.computeIfAbsent(entry.getKey(), ignored -> new ArrayList<>()).add(entry.getValue());
            }
        }
        return average(fallback);
    }

    private void collectOwnerResponseData(Seenly seenly,
                                          Map<String, Integer> selfAnswersByLens,
                                          Map<String, Double> friendAverages,
                                          Map<String, Double> friendTimeAnalytics,
                                          List<ResponseSessionDto> sessions) {
        Map<String, List<Integer>> friendValues = new HashMap<>();
        Map<String, List<Integer>> timeValues = new HashMap<>();
        if (seenly.getResponseSessions() == null) return;
        for (ResponseSession session : seenly.getResponseSessions()) {
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
        if (session == null) throw new IllegalArgumentException("Session cannot be null");

        ResponseSessionDto dto = new ResponseSessionDto();
        dto.setId(session.getId());
        dto.setNickname("unknown_person");
        dto.setCompletedAt(ZonedDateTime.of(session.getCreatedAt(), ZoneId.systemDefault()));

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

        dto.setSignals(signals);
        double accuracy = count > 0 ? 100.0 * (1.0 - totalDiff / (count * 4.0)) : 0.0;
        dto.setAccuracy(accuracy);
        dto.setReaderType(getReaderStyleForAccuracy(accuracy));
        dto.setFriendTimeAnalytics(session.getFriendTimeAnalytics() != null
            ? new HashMap<>(session.getFriendTimeAnalytics())
            : new HashMap<>());
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
