package com.seenly.backend.dto;

import com.seenly.backend.constant.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString(onlyExplicitlyIncluded = true)
public class SendOtpRequest {
    @NotBlank @Email @Size(max = 254)
    private String email;
    @NotNull
    @ToString.Include
    private OtpPurpose purpose;
}
