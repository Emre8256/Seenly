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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSeenlyRequest {
    @NotBlank(message = "Display name is required")
    @Size(max = 18, message = "Display name cannot exceed 18 characters")
    private String displayName;

    private String email;

    @NotEmpty(message = "Self answers list cannot be empty")
    @Size(min = 10, max = 10, message = "Classic self quiz requires exactly 10 answers")
    private List<SelfAnswerInput> selfAnswers;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SelfAnswerInput {
        @NotBlank(message = "Question ID is required")
        private String questionId;

        private int answerValue; // Validated 1 to 5
    }
}
