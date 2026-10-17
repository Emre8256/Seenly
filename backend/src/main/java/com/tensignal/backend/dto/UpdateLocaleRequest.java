package com.tensignal.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLocaleRequest {
    @NotBlank(message = "Locale is required")
    @Pattern(regexp = "^(?i)(tr|en)$", message = "Locale must be 'tr' or 'en'")
    private String locale;
}
