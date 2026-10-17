package com.tensignal.backend.exception;

public class EmailDeliveryException extends RuntimeException {
    public EmailDeliveryException() {
        super("Verification email could not be delivered. Please try again shortly.");
    }
}
