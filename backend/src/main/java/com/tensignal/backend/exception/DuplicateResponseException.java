package com.tensignal.backend.exception;

public class DuplicateResponseException extends RuntimeException {
    public DuplicateResponseException() {
        super("A response from this participant has already been accepted for this profile.");
    }
}
