package com.seenly.backend.entity;

public enum EmailOutboxStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED,
    SKIPPED
}
