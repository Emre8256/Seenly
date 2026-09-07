package com.seenly.backend.exception;

public class InvalidPaymentEventException extends RuntimeException {
    public InvalidPaymentEventException(String message) {
        super(message);
    }
}
