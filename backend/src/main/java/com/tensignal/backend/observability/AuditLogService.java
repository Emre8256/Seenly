package com.tensignal.backend.observability;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
public class AuditLogService {
    private static final Logger AUDIT = LoggerFactory.getLogger("tensignal.audit");
    private static final Set<String> ALLOWED_FIELDS = Set.of(
        "purpose", "reason", "policy", "provider", "product", "eventType", "outcome", "entitlement");

    public void record(AuditEvent event, String outcome) {
        record(event, outcome, Map.of());
    }

    public void record(AuditEvent event, String outcome, Map<String, String> fields) {
        Map<String, String> previous = new HashMap<>();
        put(previous, "auditEvent", event.name());
        put(previous, "auditOutcome", safeValue(outcome));
        fields.forEach((key, value) -> {
            if (ALLOWED_FIELDS.contains(key)) {
                put(previous, key, safeValue(value));
            }
        });
        try {
            AUDIT.info("security_audit_event");
        } finally {
            previous.forEach((key, value) -> {
                if (value == null) MDC.remove(key); else MDC.put(key, value);
            });
        }
    }

    private void put(Map<String, String> previous, String key, String value) {
        previous.put(key, MDC.get(key));
        MDC.put(key, value);
    }

    private String safeValue(String value) {
        if (value == null || value.isBlank()) return "unspecified";
        String safe = value.replaceAll("[^A-Za-z0-9_.-]", "_");
        return safe.substring(0, Math.min(safe.length(), 48));
    }
}
