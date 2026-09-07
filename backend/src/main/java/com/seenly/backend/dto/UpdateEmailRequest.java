package com.seenly.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class UpdateEmailRequest {

    @NotBlank(message = "Email is required.")
    @Email(message = "Geçerli bir e-posta adresi giriniz.")
    @Size(max = 254, message = "Email cannot exceed 254 characters")
    private String email;

    @NotBlank(message = "Email verification grant is required.")
    @Size(max = 128, message = "Email verification grant is too long")
    private String verificationGrant;
}
