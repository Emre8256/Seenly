package com.seenly.backend.dto;

import com.seenly.backend.constant.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(onlyExplicitlyIncluded = true)
public class VerifyOtpRequest {
    @NotBlank @Email @Size(max = 254)
    private String email;
    @NotBlank @Pattern(regexp = "\\d{4}", message = "Code must contain exactly 4 digits")
    private String code;
    @NotNull
    @ToString.Include
    private OtpPurpose purpose;
}
