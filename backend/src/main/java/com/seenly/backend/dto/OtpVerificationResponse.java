package com.seenly.backend.dto;

import lombok.Getter;

@Getter
public class OtpVerificationResponse {
    private final String status;
    private final String verificationGrant;

    public OtpVerificationResponse(String status, String verificationGrant) {
        this.status = status;
        this.verificationGrant = verificationGrant;
    }

    @Override
    public String toString() {
        return "OtpVerificationResponse[status=" + status + ", verificationGrant=<redacted>]";
    }
}
