package com.tensignal.backend.exception;

import java.time.LocalDateTime;

public class CooldownActiveException extends RuntimeException {
    private final LocalDateTime nextAllowedDate;
    private final long daysRemaining;

    public CooldownActiveException(String message, LocalDateTime nextAllowedDate, long daysRemaining) {
        super(message);
        this.nextAllowedDate = nextAllowedDate;
        this.daysRemaining = daysRemaining;
    }

    public LocalDateTime getNextAllowedDate() {
        return nextAllowedDate;
    }

    public long getDaysRemaining() {
        return daysRemaining;
    }
}
