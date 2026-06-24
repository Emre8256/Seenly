package com.seenly.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class CreateSeenlyRequest {
    @NotBlank(message = "Display name is required")
    @Size(max = 18, message = "Display name cannot exceed 18 characters")
    private String displayName;

    private String email;

    @NotEmpty(message = "Self answers list cannot be empty")
    @Size(min = 10, max = 10, message = "Classic self quiz requires exactly 10 answers")
    private List<SelfAnswerInput> selfAnswers;

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<SelfAnswerInput> getSelfAnswers() {
        return selfAnswers;
    }

    public void setSelfAnswers(List<SelfAnswerInput> selfAnswers) {
        this.selfAnswers = selfAnswers;
    }

    public static class SelfAnswerInput {
        @NotBlank(message = "Question ID is required")
        private String questionId;

        private int answerValue; // Validated 1 to 5

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
