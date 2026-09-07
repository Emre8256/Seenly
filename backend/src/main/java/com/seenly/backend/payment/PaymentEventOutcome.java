package com.seenly.backend.payment;

public enum PaymentEventOutcome {
    PROCESSED,
    IGNORED_STALE,
    IGNORED_FINAL_STATE
}
