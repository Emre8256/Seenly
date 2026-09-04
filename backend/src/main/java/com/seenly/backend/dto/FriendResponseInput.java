package com.seenly.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendResponseInput {
    @Size(max = 18, message = "Nickname cannot exceed 18 characters")
    private String nickname;

    @NotBlank(message = "Fingerprint hash is required for duplicate prevention")
    private String fingerprintHash;

    @NotEmpty(message = "Friend responses list cannot be empty")
    @Size(min = 10, max = 10, message = "Classic friend quiz requires exactly 10 answers")
    private List<AnswerInput> friendResponses;

    private Map<String, Integer> friendTimeAnalytics;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnswerInput {
        @NotBlank(message = "Question ID is required")
        private String questionId;

        private int answerValue; // 1 to 5
    }
}
