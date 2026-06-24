package com.seenly.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class EmailAuthRequest {
    @NotBlank(message = "Email is required")
    private String email;

    private String code;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
