package com.seenly.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDisplayNameRequest {

    @NotBlank(message = "Display name is required.")
    @Size(min = 2, max = 15, message = "İsminiz 2 ile 15 karakter arasında olmalıdır.")
    private String displayName;
}
