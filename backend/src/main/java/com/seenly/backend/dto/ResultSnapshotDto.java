package com.seenly.backend.dto;

import com.seenly.backend.entity.ResultSnapshot;
import com.seenly.backend.entity.SelfAnswer;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.entity.FriendResponse;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.ArrayList;

public class ResultSnapshotDto {
    private final String scoringVersion;
    private final String selfSignatureId;
    private final String selfFamilyId;
    
    // Privacy-guarded fields (Masked dynamically)
    private final String outsideSignatureId;
    private final String outsideFamilyId;
    private final String gapPatternId;
    private final String gapStrength;
    private final String confidenceBand;
    private final int responseCount;
    private final int totalProfileClicks;
    private final int totalResponders;
    private final String publicSlug;
    private final String displayName;
    private final boolean isPremium;
    private final Integer currentResponseCount;
    private final Integer maxResponseLimit;
    private final Map<String, Double> selfAverages;
    private final Map<String, Double> friendAverages;
    private final Map<String, Double> friendTimeAnalytics;
    private final List<ResponseSessionDto> responseSessions;

    public ResultSnapshotDto(ResultSnapshot snapshot) {
        if (snapshot == null) {
            throw new IllegalArgumentException("Snapshot cannot be null");
        }
        if (snapshot.getSeenly() == null) {
            throw new IllegalArgumentException("Snapshot must be associated with a valid Seenly profile");
        }

        this.scoringVersion = snapshot.getScoringVersion();
        this.selfSignatureId = snapshot.getSelfSignatureId();
        this.selfFamilyId = snapshot.getSelfFamilyId();
        this.confidenceBand = snapshot.getConfidenceBand();
        
        // Dynamically fetch properties from the associated Seenly relation
        this.responseCount = snapshot.getSeenly().getResponseCount();
        this.totalProfileClicks = snapshot.getSeenly().getTotalProfileClicks();
        this.totalResponders = snapshot.getSeenly().getResponseCount();
        this.publicSlug = snapshot.getSeenly().getPublicSlug();
        this.displayName = snapshot.getSeenly().getDisplayName();
        this.isPremium = snapshot.getSeenly().getIsPremium();
        this.currentResponseCount = snapshot.getSeenly().getResponseCount();
        this.maxResponseLimit = this.isPremium ? -1 : (snapshot.getSeenly().getBaseFormCapacity() + snapshot.getSeenly().getPurchasedExtraCapacity());

        // Dynamic Zero-Leak Privacy filtering
        if (this.responseCount >= 3) {
            this.outsideSignatureId = snapshot.getOutsideSignatureId();
            this.outsideFamilyId = snapshot.getOutsideFamilyId();
            this.gapPatternId = snapshot.getGapPatternId();
            this.gapStrength = snapshot.getGapStrength();
        } else {
            this.outsideSignatureId = null;
            this.outsideFamilyId = null;
            this.gapPatternId = null;
            this.gapStrength = null;
        }

        // Calculate self averages
        this.selfAverages = new HashMap<>();
        if (snapshot.getSeenly() != null && snapshot.getSeenly().getSelfAnswers() != null) {
            Map<String, List<Integer>> selfVals = new HashMap<>();
            for (SelfAnswer ans : snapshot.getSeenly().getSelfAnswers()) {
                String lens = extractLensFromQuestionId(ans.getQuestionId());
                selfVals.computeIfAbsent(lens, k -> new ArrayList<>()).add(ans.getAnswerValue());
            }
            for (Map.Entry<String, List<Integer>> entry : selfVals.entrySet()) {
                double sum = 0.0;
                for (int v : entry.getValue()) sum += v;
                this.selfAverages.put(entry.getKey(), sum / entry.getValue().size());
            }
        }

        // Calculate friend averages
        this.friendAverages = new HashMap<>();
        if (snapshot.getSeenly() != null && snapshot.getSeenly().getResponseSessions() != null) {
            Map<String, List<Integer>> friendVals = new HashMap<>();
            for (ResponseSession sess : snapshot.getSeenly().getResponseSessions()) {
                if (sess.getResponses() != null) {
                    for (FriendResponse resp : sess.getResponses()) {
                        String lens = extractLensFromQuestionId(resp.getQuestionId());
                        friendVals.computeIfAbsent(lens, k -> new ArrayList<>()).add(resp.getAnswerValue());
                    }
                }
            }
            for (Map.Entry<String, List<Integer>> entry : friendVals.entrySet()) {
                double sum = 0.0;
                for (int v : entry.getValue()) sum += v;
                this.friendAverages.put(entry.getKey(), sum / entry.getValue().size());
            }
        }

        // Calculate friend time analytics averages
        this.friendTimeAnalytics = new HashMap<>();
        if (snapshot.getSeenly() != null && snapshot.getSeenly().getResponseSessions() != null) {
            Map<String, List<Integer>> timeVals = new HashMap<>();
            for (ResponseSession sess : snapshot.getSeenly().getResponseSessions()) {
                if (sess.getFriendTimeAnalytics() != null) {
                    for (Map.Entry<String, Integer> entry : sess.getFriendTimeAnalytics().entrySet()) {
                        timeVals.computeIfAbsent(entry.getKey(), k -> new ArrayList<>()).add(entry.getValue());
                    }
                }
            }
            for (Map.Entry<String, List<Integer>> entry : timeVals.entrySet()) {
                double sum = 0.0;
                for (int v : entry.getValue()) sum += v;
                this.friendTimeAnalytics.put(entry.getKey(), sum / entry.getValue().size());
            }
        }

        // Calculate self answers map for accuracy computing
        Map<String, Integer> selfAnswersMap = new HashMap<>();
        if (snapshot.getSeenly() != null && snapshot.getSeenly().getSelfAnswers() != null) {
            for (SelfAnswer sa : snapshot.getSeenly().getSelfAnswers()) {
                String lens = extractLensFromQuestionId(sa.getQuestionId());
                selfAnswersMap.put(lens, sa.getAnswerValue());
            }
        }

        this.responseSessions = new ArrayList<>();
        if (snapshot.getSeenly() != null && snapshot.getSeenly().getResponseSessions() != null) {
            for (ResponseSession sess : snapshot.getSeenly().getResponseSessions()) {
                this.responseSessions.add(new ResponseSessionDto(sess, selfAnswersMap));
            }
            // Sort by completedAt descending
            this.responseSessions.sort((a, b) -> b.getCompletedAt().compareTo(a.getCompletedAt()));
        }
    }

    public String getScoringVersion() {
        return scoringVersion;
    }

    public String getSelfSignatureId() {
        return selfSignatureId;
    }

    public String getSelfFamilyId() {
        return selfFamilyId;
    }

    public String getOutsideSignatureId() {
        return outsideSignatureId;
    }

    public String getOutsideFamilyId() {
        return outsideFamilyId;
    }

    public String getGapPatternId() {
        return gapPatternId;
    }

    public String getGapStrength() {
        return gapStrength;
    }

    public String getConfidenceBand() {
        return confidenceBand;
    }

    public int getResponseCount() {
        return responseCount;
    }

    public String getPublicSlug() {
        return publicSlug;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean getIsPremium() {
        return isPremium;
    }

    public Integer getCurrentResponseCount() {
        return currentResponseCount;
    }

    public Integer getMaxResponseLimit() {
        return maxResponseLimit;
    }

    private String extractLensFromQuestionId(String questionId) {
        if (questionId == null) return "samimiyet";
        String[] parts = questionId.split("_");
        if (parts.length >= 3) {
            return parts[2];
        }
        return "samimiyet";
    }

    public Map<String, Double> getSelfAverages() {
        return selfAverages;
    }

    public Map<String, Double> getFriendAverages() {
        return friendAverages;
    }

    public Map<String, Double> getFriendTimeAnalytics() {
        return friendTimeAnalytics;
    }

    public int getTotalProfileClicks() {
        return totalProfileClicks;
    }

    public int getTotalResponders() {
        return totalResponders;
    }

    public List<ResponseSessionDto> getResponseSessions() {
        return responseSessions;
    }
}
