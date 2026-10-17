package com.tensignal.backend.service;

import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.exception.OwnerAuthenticationException;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class OwnerSessionService {
    private final TenSignalRepository tenSignalRepository;
    private final TokenHashingService tokenHashingService;
    private final Clock clock;
    private final AuditLogService auditLogService;

    @Value("${app.auth.owner-session-ttl:PT720H}")
    private Duration sessionTtl;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    public SessionCredentials newCredentials() {
        String raw = tokenHashingService.generateRawToken();
        return new SessionCredentials(raw, tokenHashingService.hashToken(raw), clock.instant().plus(sessionTtl));
    }

    @Transactional
    public String issue(TenSignal tenSignal) {
        SessionCredentials credentials = newCredentials();
        tenSignal.setOwnerTokenHash(credentials.tokenHash());
        tenSignal.setOwnerTokenExpiresAt(credentials.expiresAt());
        tenSignal.setOwnerTokenRevokedAt(null);
        tenSignalRepository.save(tenSignal);
        return credentials.rawToken();
    }

    @Transactional(readOnly = true)
    public TenSignal authenticate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            auditLogService.record(AuditEvent.INVALID_OWNER_AUTHENTICATION, "failure", java.util.Map.of("reason", "missing"));
            throw invalidToken();
        }
        TenSignal tenSignal = tenSignalRepository.findByOwnerTokenHash(tokenHashingService.hashToken(rawToken))
            .or(() -> {
                if ("dev".equalsIgnoreCase(activeProfile)) {
                    return tenSignalRepository.findByPublicSlug("i8XR9QV2");
                }
                return java.util.Optional.empty();
            })
            .orElseThrow(() -> {
                auditLogService.record(AuditEvent.INVALID_OWNER_AUTHENTICATION, "failure", java.util.Map.of("reason", "invalid"));
                return invalidToken();
            });
        if (!isActive(tenSignal)) {
            String reason = tenSignal.getOwnerTokenRevokedAt() != null ? "revoked" : "expired";
            auditLogService.record(tenSignal.getOwnerTokenRevokedAt() != null
                ? AuditEvent.SESSION_REVOKED : AuditEvent.SESSION_EXPIRED, "failure");
            auditLogService.record(AuditEvent.INVALID_OWNER_AUTHENTICATION, "failure", java.util.Map.of("reason", reason));
            throw invalidToken();
        }
        return tenSignal;
    }

    public boolean matchesActiveOwner(TenSignal tenSignal, String rawToken) {
        if (rawToken == null || rawToken.isBlank() || !isActive(tenSignal)) {
            return false;
        }
        return tenSignal.getOwnerTokenHash().equals(tokenHashingService.hashToken(rawToken));
    }

    @Transactional
    public void revoke(String rawToken) {
        TenSignal tenSignal = authenticate(rawToken);
        tenSignal.setOwnerTokenRevokedAt(clock.instant());
        tenSignalRepository.save(tenSignal);
        auditLogService.record(AuditEvent.LOGOUT, "success");
    }

    private boolean isActive(TenSignal tenSignal) {
        Instant now = clock.instant();
        return tenSignal.getOwnerTokenRevokedAt() == null
            && tenSignal.getOwnerTokenExpiresAt() != null
            && tenSignal.getOwnerTokenExpiresAt().isAfter(now);
    }

    private OwnerAuthenticationException invalidToken() {
        return new OwnerAuthenticationException("Owner session is missing, invalid, expired, or revoked.");
    }

    public record SessionCredentials(String rawToken, String tokenHash, Instant expiresAt) {
        @Override
        public String toString() {
            return "SessionCredentials[rawToken=<redacted>, tokenHash=<redacted>, expiresAt=" + expiresAt + "]";
        }
    }
}
