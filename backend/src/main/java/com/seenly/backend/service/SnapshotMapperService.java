package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.dto.ResponseSessionDto;
import com.seenly.backend.dto.ResultSnapshotDto;
import com.seenly.backend.entity.FriendResponse;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.entity.ResultSnapshot;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.SelfAnswer;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class SnapshotMapperService {

    /**
     * Maps a ResultSnapshot entity and its associated Seenly profile to a ResultSnapshotDto.
     */
    public ResultSnapshotDto toDto(ResultSnapshot snapshot) {
        if (snapshot == null) {
            throw new IllegalArgumentException("Snapshot cannot be null");
        }
        Seenly seenly = snapshot.getSeenly();
        if (seenly == null) {
            throw new IllegalArgumentException("Snapshot must be associated with a valid Seenly profile");
        }

        ResultSnapshotDto dto = new ResultSnapshotDto();
        dto.setScoringVersion(snapshot.getScoringVersion());
        dto.setSelfSignatureId(snapshot.getSelfSignatureId());
        dto.setSelfFamilyId(snapshot.getSelfFamilyId());
        dto.setConfidenceBand(snapshot.getConfidenceBand());

        dto.setResponseCount(seenly.getResponseCount());
        dto.setTotalProfileClicks(seenly.getTotalProfileClicks());
        dto.setTotalResponders(seenly.getResponseCount());
        dto.setPublicSlug(seenly.getPublicSlug());
        dto.setDisplayName(seenly.getDisplayName());
        dto.setEmail(seenly.getEmail());
        dto.setAvatar(seenly.getAvatar());
        dto.setIsPremium(seenly.getIsPremium());
        dto.setCurrentResponseCount(seenly.getResponseCount());
        dto.setMaxResponseLimit(seenly.getIsPremium() ? -1 : (seenly.getBaseFormCapacity() + seenly.getPurchasedExtraCapacity()));

        // Name change cooldown calculation
        LocalDateTime lastChanged = seenly.getLastNameChangedAt();
        dto.setLastNameChangedAt(lastChanged);
        if (lastChanged != null) {
            LocalDateTime nextAllowed = lastChanged.plusDays(AppConstants.NAME_CHANGE_COOLDOWN_DAYS);
            if (LocalDateTime.now().isBefore(nextAllowed)) {
                dto.setNextAllowedNameChangeDate(nextAllowed);
                dto.setNameChangeDaysRemaining(ChronoUnit.DAYS.between(LocalDateTime.now(), nextAllowed) + 1);
            } else {
                dto.setNextAllowedNameChangeDate(null);
                dto.setNameChangeDaysRemaining(0L);
            }
        } else {
            dto.setNextAllowedNameChangeDate(null);
            dto.setNameChangeDaysRemaining(0L);
        }

        // Privacy guarding: outside & gap are only visible after 3 responses
        if (seenly.getResponseCount() >= 3) {
            dto.setOutsideSignatureId(snapshot.getOutsideSignatureId());
            dto.setOutsideFamilyId(snapshot.getOutsideFamilyId());
            dto.setGapPatternId(snapshot.getGapPatternId());
            dto.setGapStrength(snapshot.getGapStrength());
        } else {
            dto.setOutsideSignatureId(null);
            dto.setOutsideFamilyId(null);
            dto.setGapPatternId(null);
            dto.setGapStrength(null);
        }

        // Self averages calculation
        Map<String, Integer> selfAnswersMap = new HashMap<>();
        Map<String, Double> selfAverages = new HashMap<>();
        if (seenly.getSelfAnswers() != null) {
            Map<String, List<Integer>> selfVals = new HashMap<>();
            for (SelfAnswer ans : seenly.getSelfAnswers()) {
                String lens = extractLensFromQuestionId(ans.getQuestionId());
                selfVals.computeIfAbsent(lens, k -> new ArrayList<>()).add(ans.getAnswerValue());
                selfAnswersMap.put(lens, ans.getAnswerValue());
            }
            for (Map.Entry<String, List<Integer>> entry : selfVals.entrySet()) {
                double sum = 0.0;
                for (int v : entry.getValue()) sum += v;
                selfAverages.put(entry.getKey(), sum / entry.getValue().size());
            }
        }
        dto.setSelfAverages(selfAverages);

        // Friend averages calculation
        Map<String, Double> friendAverages = new HashMap<>();
        Map<String, Double> friendTimeAnalytics = new HashMap<>();
        List<ResponseSessionDto> sessionDtos = new ArrayList<>();

        if (seenly.getResponseSessions() != null) {
            Map<String, List<Integer>> friendVals = new HashMap<>();
            Map<String, List<Integer>> timeVals = new HashMap<>();

            for (ResponseSession sess : seenly.getResponseSessions()) {
                sessionDtos.add(toSessionDto(sess, selfAnswersMap));

                if (sess.getResponses() != null) {
                    for (FriendResponse resp : sess.getResponses()) {
                        String lens = extractLensFromQuestionId(resp.getQuestionId());
                        friendVals.computeIfAbsent(lens, k -> new ArrayList<>()).add(resp.getAnswerValue());
                    }
                }

                if (sess.getFriendTimeAnalytics() != null) {
                    for (Map.Entry<String, Integer> entry : sess.getFriendTimeAnalytics().entrySet()) {
                        timeVals.computeIfAbsent(entry.getKey(), k -> new ArrayList<>()).add(entry.getValue());
                    }
                }
            }

            for (Map.Entry<String, List<Integer>> entry : friendVals.entrySet()) {
                double sum = 0.0;
                for (int v : entry.getValue()) sum += v;
                friendAverages.put(entry.getKey(), sum / entry.getValue().size());
            }

            for (Map.Entry<String, List<Integer>> entry : timeVals.entrySet()) {
                double sum = 0.0;
                for (int v : entry.getValue()) sum += v;
                friendTimeAnalytics.put(entry.getKey(), sum / entry.getValue().size());
            }

            // Sort response sessions by completedAt descending
            sessionDtos.sort((a, b) -> b.getCompletedAt().compareTo(a.getCompletedAt()));
        }

        dto.setFriendAverages(friendAverages);
        dto.setFriendTimeAnalytics(friendTimeAnalytics);
        dto.setResponseSessions(sessionDtos);

        return dto;
    }

    /**
     * Maps a ResponseSession entity to a ResponseSessionDto.
     */
    public ResponseSessionDto toSessionDto(ResponseSession session, Map<String, Integer> selfAnswersMap) {
        if (session == null) {
            throw new IllegalArgumentException("Session cannot be null");
        }

        ResponseSessionDto dto = new ResponseSessionDto();
        dto.setId(session.getId());
        dto.setNickname("unknown_person");
        dto.setCompletedAt(ZonedDateTime.of(session.getCreatedAt(), ZoneId.systemDefault()));

        Map<String, Integer> signals = new HashMap<>();
        double totalDiff = 0.0;
        int count = 0;

        if (session.getResponses() != null) {
            for (FriendResponse fr : session.getResponses()) {
                String lens = extractLensFromQuestionId(fr.getQuestionId());
                signals.put(lens, fr.getAnswerValue());

                if (selfAnswersMap != null && selfAnswersMap.containsKey(lens)) {
                    totalDiff += Math.abs(fr.getAnswerValue() - selfAnswersMap.get(lens));
                    count++;
                }
            }
        }
        dto.setSignals(signals);

        double accuracy = (count > 0) ? (100.0 * (1.0 - (totalDiff / (count * 4.0)))) : 0.0;
        dto.setAccuracy(accuracy);
        dto.setReaderType(getReaderStyleForAccuracy(accuracy));
        dto.setFriendTimeAnalytics(session.getFriendTimeAnalytics() != null ? new HashMap<>(session.getFriendTimeAnalytics()) : new HashMap<>());

        return dto;
    }

    public static String extractLensFromQuestionId(String questionId) {
        if (questionId == null) return "samimiyet";
        String lower = questionId.toLowerCase();
        for (String lens : AppConstants.LENSES) {
            if (lower.contains(lens)) {
                return lens;
            }
        }
        String[] parts = questionId.split("_");
        if (parts.length >= 3) {
            return parts[2].toLowerCase();
        }
        return "samimiyet";
    }

    public static String getReaderStyleForAccuracy(double accuracy) {
        if (accuracy >= 90.0) {
            return "telepathic_reader";
        } else if (accuracy >= 75.0) {
            return "clear_reader";
        } else if (accuracy >= 55.0) {
            return "balanced_reader";
        } else if (accuracy >= 35.0) {
            return "casual_explorer";
        } else {
            return "social_stranger";
        }
    }
}
