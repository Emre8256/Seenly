package com.tensignal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class EligibilityCheckRequest {
    @NotBlank(message = "Fingerprint signal is required")
    @Size(max = 128, message = "Fingerprint signal cannot exceed 128 characters")
    private String fingerprintHash;
}
