package com.tensignal.backend.entity;

public enum EmailOutboxStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED,
    SKIPPED
}
