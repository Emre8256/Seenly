package com.tensignal.backend.dto;

import lombok.Getter;

@Getter
public class LoginResponse {
    private final String ownerToken;
    private final String publicSlug;
    private final String preferredLocale;

    public LoginResponse(String ownerToken, String publicSlug) {
        this(ownerToken, publicSlug, null);
    }

    public LoginResponse(String ownerToken, String publicSlug, String preferredLocale) {
        this.ownerToken = ownerToken;
        this.publicSlug = publicSlug;
        this.preferredLocale = preferredLocale;
    }

    @Override
    public String toString() {
        return "LoginResponse[ownerToken=<redacted>, publicSlug=" + publicSlug + "]";
    }
}
