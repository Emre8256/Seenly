package com.seenly.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
public class UpdateAvatarRequest {

    @NotBlank(message = "Avatar is required.")
    @Pattern(regexp = "(?:kadin|erkek)[1-6]", message = "Avatar identifier is invalid.")
    private String avatar;
}
