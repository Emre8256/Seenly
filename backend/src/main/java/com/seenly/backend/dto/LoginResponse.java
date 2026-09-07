package com.seenly.backend.dto;

import lombok.Getter;

@Getter
public class LoginResponse {
    private final String ownerToken;
    private final String publicSlug;

    public LoginResponse(String ownerToken, String publicSlug) {
        this.ownerToken = ownerToken;
        this.publicSlug = publicSlug;
    }

    @Override
    public String toString() {
        return "LoginResponse[ownerToken=<redacted>, publicSlug=" + publicSlug + "]";
    }
}
