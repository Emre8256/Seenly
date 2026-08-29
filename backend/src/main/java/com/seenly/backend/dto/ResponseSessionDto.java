package com.seenly.backend.dto;

import com.seenly.backend.entity.FriendResponse;
import com.seenly.backend.entity.ResponseSession;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class ResponseSessionDto {
    private final UUID id;
    private final String nickname;
    private final ZonedDateTime completedAt;
    private final Map<String, Integer> signals;
    private final String readerType;
    private final double accuracy;
    private final Map<String, Integer> friendTimeAnalytics;

    public ResponseSessionDto(ResponseSession session, Map<String, Integer> selfAnswersMap) {
        if (session == null) {
            throw new IllegalArgumentException("Session cannot be null");
        }
        this.id = session.getId();
        this.nickname = "unknown_person";
        this.completedAt = ZonedDateTime.of(session.getCreatedAt(), ZoneId.systemDefault());

        // Extract 10 signals category mapping
        this.signals = new HashMap<>();
        if (session.getResponses() != null) {
            for (FriendResponse fr : session.getResponses()) {
                String lens = extractLensFromQuestionId(fr.getQuestionId());
                this.signals.put(lens, fr.getAnswerValue());
            }
        }

        // Calculate accuracy & readerType
        double calculatedAccuracy = 0.0;
        if (session.getResponses() != null && !session.getResponses().isEmpty() && selfAnswersMap != null && !selfAnswersMap.isEmpty()) {
            double totalDiff = 0.0;
            int count = 0;
            for (FriendResponse fr : session.getResponses()) {
                String lens = extractLensFromQuestionId(fr.getQuestionId());
                Integer selfVal = selfAnswersMap.get(lens);
                if (selfVal != null) {
                    totalDiff += Math.abs(fr.getAnswerValue() - selfVal);
                    count++;
                }
            }
            if (count > 0) {
                double maxDiff = count * 4.0;
                calculatedAccuracy = 100.0 * (1.0 - (totalDiff / maxDiff));
            }
        }
        this.accuracy = calculatedAccuracy;
        this.readerType = getReaderStyleForAccuracy(calculatedAccuracy);
        this.friendTimeAnalytics = session.getFriendTimeAnalytics() != null ? new HashMap<>(session.getFriendTimeAnalytics()) : new HashMap<>();
    }

    private String extractLensFromQuestionId(String questionId) {
        if (questionId == null) return "samimiyet";
        String lower = questionId.toLowerCase();
        for (String lens : java.util.Arrays.asList("samimiyet", "cekicilik", "zeka", "vizyon", "enerji", "guvenilirlik", "ego", "basari", "comertlik", "olgunluk")) {
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

    private String getReaderStyleForAccuracy(double accuracy) {
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

    public UUID getId() {
        return id;
    }

    public String getNickname() {
        return nickname;
    }

    public ZonedDateTime getCompletedAt() {
        return completedAt;
    }

    public Map<String, Integer> getSignals() {
        return signals;
    }

    public String getReaderType() {
        return readerType;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public Map<String, Integer> getFriendTimeAnalytics() {
        return friendTimeAnalytics;
    }
}
