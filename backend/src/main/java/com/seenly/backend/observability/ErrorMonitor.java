package com.seenly.backend.observability;

public interface ErrorMonitor {
    void capture(Throwable error, ErrorContext context);

    record ErrorContext(String requestId, String method, String normalizedPath) { }
}
