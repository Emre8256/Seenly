package com.seenly.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class FriendResponseInput {
    @Size(max = 18, message = "Nickname cannot exceed 18 characters")
    private String nickname;

    @NotBlank(message = "Fingerprint hash is required for duplicate prevention")
    @Size(max = 128, message = "Fingerprint signal cannot exceed 128 characters")
    private String fingerprintHash;

    @NotEmpty(message = "Friend responses list cannot be empty")
    @Size(min = 10, max = 10, message = "Classic friend quiz requires exactly 10 answers")
    private List<@Valid AnswerInput> friendResponses;

    @Size(max = 10, message = "Timing analytics cannot exceed 10 entries")
    private Map<String, Integer> friendTimeAnalytics;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @ToString(onlyExplicitlyIncluded = true)
    public static class AnswerInput {
        @NotBlank(message = "Question ID is required")
        @Size(max = 64, message = "Question ID is too long")
        @Pattern(regexp = "[a-z0-9_]+", message = "Question ID has an invalid format")
        private String questionId;

        @Min(value = 1, message = "Answer value must be between 1 and 5")
        @Max(value = 5, message = "Answer value must be between 1 and 5")
        private int answerValue; // 1 to 5
    }
}
