package com.seenly.backend.email;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EmailSendResult {

    private final boolean success;
    private final boolean disabled;
    private final boolean retryable;
    private final String providerMessageId;
    private final String errorMessage;

    public static EmailSendResult success(String providerMessageId) {
        return EmailSendResult.builder()
            .success(true)
            .disabled(false)
            .retryable(false)
            .providerMessageId(providerMessageId)
            .build();
    }

    public static EmailSendResult disabled() {
        return EmailSendResult.builder()
            .success(true)
            .disabled(true)
            .retryable(false)
            .providerMessageId("disabled-mock-id")
            .build();
    }

    public static EmailSendResult failure(String errorMessage, boolean retryable) {
        return EmailSendResult.builder()
            .success(false)
            .disabled(false)
            .retryable(retryable)
            .errorMessage(errorMessage)
            .build();
    }
}
