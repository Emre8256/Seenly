package com.seenly.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class FriendResponseInput {
    @Size(max = 18, message = "Nickname cannot exceed 18 characters")
    private String nickname;

    @NotBlank(message = "Fingerprint hash is required for duplicate prevention")
    private String fingerprintHash;

    @NotEmpty(message = "Friend responses list cannot be empty")
    @Size(min = 10, max = 10, message = "Classic friend quiz requires exactly 10 answers")
    private List<AnswerInput> friendResponses;

    private java.util.Map<String, Integer> friendTimeAnalytics;

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getFingerprintHash() {
        return fingerprintHash;
    }

    public void setFingerprintHash(String fingerprintHash) {
        this.fingerprintHash = fingerprintHash;
    }

    public List<AnswerInput> getFriendResponses() {
        return friendResponses;
    }

    public void setFriendResponses(List<AnswerInput> friendResponses) {
        this.friendResponses = friendResponses;
    }

    public java.util.Map<String, Integer> getFriendTimeAnalytics() {
        return friendTimeAnalytics;
    }

    public void setFriendTimeAnalytics(java.util.Map<String, Integer> friendTimeAnalytics) {
        this.friendTimeAnalytics = friendTimeAnalytics;
    }

    public static class AnswerInput {
        @NotBlank(message = "Question ID is required")
        private String questionId;

        private int answerValue; // 1 to 5

        public String getQuestionId() {
            return questionId;
        }

        public void setQuestionId(String questionId) {
            this.questionId = questionId;
        }

        public int getAnswerValue() {
            return answerValue;
        }

        public void setAnswerValue(int answerValue) {
            this.answerValue = answerValue;
        }
    }
}
