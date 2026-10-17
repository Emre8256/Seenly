package com.tensignal.backend.service;

import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.exception.OwnerAuthenticationException;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tensignal.backend.email.EmailNotificationService;
import com.tensignal.backend.email.NotificationType;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final TenSignalRepository tenSignalRepository;
    private final UserRepository userRepository;
    private final OwnerSessionService ownerSessionService;
    private final AuditLogService auditLogService;
    private final EmailNotificationService emailNotificationService;

    /**
     * Completely deletes the user account, associated TenSignal profiles, and cascade-removes data.
     */
    @Transactional
    public void deleteAccount(String ownerToken) {
        validateOwnerToken(ownerToken);
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);
        User user = tenSignal.getUser();
        String email = user != null ? user.getEmail() : tenSignal.getEmail();
        UUID userId = user != null ? user.getId() : null;

        if (email != null && !email.isBlank()) {
            String accountLocale = user != null && user.getPreferredLocale() != null
                ? user.getPreferredLocale()
                : (tenSignal.getPreferredLocale() != null ? tenSignal.getPreferredLocale() : "en");
            try {
                emailNotificationService.enqueue(
                    NotificationType.ACCOUNT_DELETED,
                    email,
                    userId,
                    accountLocale,
                    Map.of("homeUrl", "https://tensignal.app"),
                    "account-deleted:" + (userId != null ? userId : tenSignal.getId()) + ":" + System.currentTimeMillis(),
                    Instant.now(),
                    Instant.now().plus(Duration.ofHours(24))
                );
            } catch (Exception ex) {
                log.warn("Failed to enqueue account deletion email notification: {}", ex.getMessage());
            }
        }

        if (user != null) {
            // Find and delete all TenSignal profiles belonging to this user
            List<TenSignal> userTenSignals = tenSignalRepository.findByUser(user);
            for (TenSignal s : userTenSignals) {
                tenSignalRepository.delete(s);
            }

            // Delete the user
            userRepository.delete(user);
        } else {
            tenSignalRepository.delete(tenSignal);
        }
        auditLogService.record(AuditEvent.ACCOUNT_DELETED, "success");
    }

    private TenSignal getTenSignalFromToken(String ownerToken) {
        return ownerSessionService.authenticate(ownerToken);
    }

    private void validateOwnerToken(String ownerToken) {
        if (ownerToken == null || ownerToken.trim().isEmpty()) {
            throw new OwnerAuthenticationException("A valid owner token is required.");
        }
    }
}
