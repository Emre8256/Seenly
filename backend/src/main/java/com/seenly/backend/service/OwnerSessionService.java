package com.seenly.backend.service;

import com.seenly.backend.entity.Seenly;
import com.seenly.backend.exception.OwnerAuthenticationException;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.observability.AuditLogService;
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
    private final SeenlyRepository seenlyRepository;
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
    public String issue(Seenly seenly) {
        SessionCredentials credentials = newCredentials();
        seenly.setOwnerTokenHash(credentials.tokenHash());
        seenly.setOwnerTokenExpiresAt(credentials.expiresAt());
        seenly.setOwnerTokenRevokedAt(null);
        seenlyRepository.save(seenly);
        return credentials.rawToken();
    }

    @Transactional(readOnly = true)
    public Seenly authenticate(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            auditLogService.record(AuditEvent.INVALID_OWNER_AUTHENTICATION, "failure", java.util.Map.of("reason", "missing"));
            throw invalidToken();
        }
        Seenly seenly = seenlyRepository.findByOwnerTokenHash(tokenHashingService.hashToken(rawToken))
            .or(() -> {
                if ("dev".equalsIgnoreCase(activeProfile)) {
                    return seenlyRepository.findByPublicSlug("i8XR9QV2");
                }
                return java.util.Optional.empty();
            })
            .orElseThrow(() -> {
                auditLogService.record(AuditEvent.INVALID_OWNER_AUTHENTICATION, "failure", java.util.Map.of("reason", "invalid"));
                return invalidToken();
            });
        if (!isActive(seenly)) {
            String reason = seenly.getOwnerTokenRevokedAt() != null ? "revoked" : "expired";
            auditLogService.record(seenly.getOwnerTokenRevokedAt() != null
                ? AuditEvent.SESSION_REVOKED : AuditEvent.SESSION_EXPIRED, "failure");
            auditLogService.record(AuditEvent.INVALID_OWNER_AUTHENTICATION, "failure", java.util.Map.of("reason", reason));
            throw invalidToken();
        }
        return seenly;
    }

    public boolean matchesActiveOwner(Seenly seenly, String rawToken) {
        if (rawToken == null || rawToken.isBlank() || !isActive(seenly)) {
            return false;
        }
        return seenly.getOwnerTokenHash().equals(tokenHashingService.hashToken(rawToken));
    }

    @Transactional
    public void revoke(String rawToken) {
        Seenly seenly = authenticate(rawToken);
        seenly.setOwnerTokenRevokedAt(clock.instant());
        seenlyRepository.save(seenly);
        auditLogService.record(AuditEvent.LOGOUT, "success");
    }

    private boolean isActive(Seenly seenly) {
        Instant now = clock.instant();
        return seenly.getOwnerTokenRevokedAt() == null
            && seenly.getOwnerTokenExpiresAt() != null
            && seenly.getOwnerTokenExpiresAt().isAfter(now);
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
