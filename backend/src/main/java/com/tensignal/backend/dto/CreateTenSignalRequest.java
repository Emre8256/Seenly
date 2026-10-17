package com.tensignal.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class CreateTenSignalRequest {
    @NotBlank(message = "Display name is required")
    @Size(min = 2, max = 18, message = "Display name must contain between 2 and 18 characters")
    private String displayName;

    @NotBlank(message = "Email is required")
    @Email(message = "A valid email is required")
    @Size(max = 254, message = "Email cannot exceed 254 characters")
    private String email;

    @NotBlank(message = "Registration verification grant is required")
    @Size(max = 128, message = "Registration verification grant is too long")
    private String registrationGrant;

    @NotEmpty(message = "Self answers list cannot be empty")
    @Size(min = 10, max = 10, message = "Classic self quiz requires exactly 10 answers")
    private List<@Valid SelfAnswerInput> selfAnswers;

    @Pattern(regexp = "^(?i)(tr|en)$", message = "Locale must be 'tr' or 'en'")
    private String locale;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @ToString(onlyExplicitlyIncluded = true)
    public static class SelfAnswerInput {
        @NotBlank(message = "Question ID is required")
        @Size(max = 64, message = "Question ID is too long")
        @Pattern(regexp = "[a-z0-9_]+", message = "Question ID has an invalid format")
        private String questionId;

        @Min(value = 1, message = "Answer value must be between 1 and 5")
        @Max(value = 5, message = "Answer value must be between 1 and 5")
        private int answerValue; // Validated 1 to 5
    }
}
