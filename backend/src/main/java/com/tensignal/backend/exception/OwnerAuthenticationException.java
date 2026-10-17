package com.tensignal.backend.exception;

public class OwnerAuthenticationException extends RuntimeException {
    public OwnerAuthenticationException(String message) {
        super(message);
    }
}
