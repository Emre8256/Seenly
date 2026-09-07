package com.seenly.backend.exception;

public class InvalidPaymentSignatureException extends RuntimeException {
    public InvalidPaymentSignatureException() {
        super("Missing or invalid payment webhook signature.");
    }
}
