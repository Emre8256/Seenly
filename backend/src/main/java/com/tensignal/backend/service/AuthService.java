package com.tensignal.backend.service;

import com.tensignal.backend.constant.OtpPurpose;
import com.tensignal.backend.dto.LoginResponse;
import com.tensignal.backend.dto.OtpVerificationResponse;
import com.tensignal.backend.entity.OtpChallenge;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.VerificationGrant;
import com.tensignal.backend.exception.EmailNotFoundException;
import com.tensignal.backend.exception.EmailAlreadyExistsException;
import com.tensignal.backend.exception.EmailDeliveryException;
import com.tensignal.backend.exception.OtpCooldownException;
import com.tensignal.backend.exception.VerificationException;
import com.tensignal.backend.repository.OtpChallengeRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.VerificationGrantRepository;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import com.tensignal.backend.observability.TransactionalObservability;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.repository.EmailOutboxRepository;
import com.tensignal.backend.email.NotificationType;
import com.tensignal.backend.email.EmailNotificationService;
import com.tensignal.backend.entity.EmailOutboxEntity;
import com.tensignal.backend.entity.EmailOutboxStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository challengeRepository;
    private final VerificationGrantRepository grantRepository;
    private final TenSignalRepository tenSignalRepository;
    private final UserRepository userRepository;
    private final EmailOutboxRepository outboxRepository;
    private final SecretHashingService secretHashingService;
    private final TokenHashingService tokenHashingService;
    private final OtpDeliveryService otpDeliveryService;
    private final OwnerSessionService ownerSessionService;
    private final AuditLogService auditLogService;
    private final ApplicationMetrics metrics;
    private final TransactionalObservability transactionalObservability;
    private final Clock clock;

    @Value("${app.auth.otp-ttl:PT10M}")
    private Duration otpTtl;
    @Value("${app.auth.otp-resend-cooldown:PT1M}")
    private Duration resendCooldown;
    @Value("${app.auth.verification-grant-ttl:PT30M}")
    private Duration grantTtl;
    @Value("${app.auth.otp-max-attempts:5}")
    private int maxAttempts;

    @Transactional
    public Map<String, String> sendVerificationCode(String email, OtpPurpose purpose, String ownerToken) {
        return sendVerificationCode(email, purpose, ownerToken, null);
    }

    @Transactional
    public Map<String, String> sendVerificationCode(String email, OtpPurpose purpose, String ownerToken, String requestedLocale) {
        String normalizedEmail = normalizeEmail(email);
        UUID ownerId = validatePurposeAndResolveOwner(normalizedEmail, purpose, ownerToken);
        Instant now = clock.instant();

        if (purpose == OtpPurpose.EMAIL_CHANGE && ownerId != null) {
            // Concurrency control: Acquire pessimistic lock on the account to serialize simultaneous requests
            tenSignalRepository.findByIdForUpdate(ownerId);
            // Atomically invalidate any prior unconsumed challenges and grants for this owner
            challengeRepository.invalidatePendingChallengesForOwner(ownerId, OtpPurpose.EMAIL_CHANGE, now);
            grantRepository.invalidatePendingGrantsForOwner(ownerId, OtpPurpose.EMAIL_CHANGE, now);
        }

        String key = challengeKey(normalizedEmail, purpose, ownerId);

        OtpChallenge challenge = challengeRepository.findByKeyForUpdate(key).orElse(null);
        if (challenge != null && challenge.getResendAvailableAt().isAfter(now)) {
            long retryAfter = Math.max(1, ChronoUnit.SECONDS.between(now, challenge.getResendAvailableAt()));
            throw new OtpCooldownException("Please wait before requesting another verification code.", retryAfter);
        }

        String code = String.format(Locale.ROOT, "%04d", RANDOM.nextInt(10_000));
        if (challenge == null) {
            challenge = new OtpChallenge();
            challenge.setChallengeKey(key);
        }
        challenge.setEmail(normalizedEmail);
        challenge.setPurpose(purpose);
        challenge.setOwnerProfileId(ownerId);
        challenge.setCodeHash(secretHashingService.hash(code));
        challenge.setExpiresAt(now.plus(otpTtl));
        challenge.setResendAvailableAt(now.plus(resendCooldown));
        challenge.setFailedAttempts(0);
        challenge.setConsumedAt(null);
        challengeRepository.saveAndFlush(challenge);

        // Resolve OTP delivery locale: Account preferredLocale > validated requestedLocale > fallback "en"
        String resolvedLocale = null;
        if (purpose == OtpPurpose.EMAIL_CHANGE && ownerId != null) {
            TenSignal owner = tenSignalRepository.findById(ownerId).orElse(null);
            if (owner != null && owner.getPreferredLocale() != null) {
                resolvedLocale = owner.getPreferredLocale();
            }
        }
        if (resolvedLocale == null) {
            Optional<TenSignal> existingTenSignal = tenSignalRepository.findFirstByEmailOrderByCreatedAtDesc(normalizedEmail);
            if (existingTenSignal.isPresent() && existingTenSignal.get().getPreferredLocale() != null) {
                resolvedLocale = existingTenSignal.get().getPreferredLocale();
            }
        }
        if (resolvedLocale == null) {
            Optional<User> existingUser = userRepository.findByEmail(normalizedEmail);
            if (existingUser.isPresent() && existingUser.get().getPreferredLocale() != null) {
                resolvedLocale = existingUser.get().getPreferredLocale();
            }
        }
        if (resolvedLocale == null) {
            if (requestedLocale != null && (requestedLocale.equalsIgnoreCase("tr") || requestedLocale.equalsIgnoreCase("en"))) {
                resolvedLocale = requestedLocale.trim().toLowerCase(Locale.ROOT);
            } else {
                resolvedLocale = "en"; // Default fallback
            }
        }

        try {
            otpDeliveryService.send(normalizedEmail, code, purpose, resolvedLocale);
        } catch (RuntimeException ex) {
            metrics.resilienceFailure("smtp");
            auditLogService.record(AuditEvent.OTP_DELIVERY_FAILED, "failure",
                Map.of("purpose", purpose.name(), "reason", ex.getClass().getSimpleName()));
            throw new EmailDeliveryException();
        }
        transactionalObservability.afterCommit(() -> {
            metrics.otpRequest(purpose.name());
            auditLogService.record(AuditEvent.OTP_REQUESTED, "success", Map.of("purpose", purpose.name()));
        });
        return Map.of("status", "success", "message", "If the request is valid, a verification code has been sent.");
    }

    @Transactional(noRollbackFor = VerificationException.class)
    public OtpVerificationResponse verifyCode(String email, String code, OtpPurpose purpose, String ownerToken) {
        String purposeTag = purpose == null ? "UNKNOWN" : purpose.name();
        try {
            if (purpose == OtpPurpose.LOGIN) {
                throw new VerificationException("Login codes must be used through the login endpoint.");
            }
            String normalizedEmail = normalizeEmail(email);
            UUID ownerId = validatePurposeAndResolveOwner(normalizedEmail, purpose, ownerToken);
            verifyAndConsumeChallenge(normalizedEmail, code, purpose, ownerId);
            metrics.otpVerification(purposeTag, "success");
            auditLogService.record(AuditEvent.OTP_VERIFICATION_SUCCEEDED, "success", Map.of("purpose", purposeTag));
            return new OtpVerificationResponse("success", issueGrant(normalizedEmail, purpose, ownerId));
        } catch (RuntimeException ex) {
            metrics.otpVerification(purposeTag, "failure");
            auditLogService.record(AuditEvent.OTP_VERIFICATION_FAILED, "failure", Map.of("purpose", purposeTag));
            throw ex;
        }
    }

    @Transactional(noRollbackFor = VerificationException.class)
    public LoginResponse loginWithEmail(String email, String code) {
        boolean otpVerified = false;
        try {
            String normalizedEmail = normalizeEmail(email);
            verifyAndConsumeChallenge(normalizedEmail, code, OtpPurpose.LOGIN, null);
            otpVerified = true;
            metrics.otpVerification(OtpPurpose.LOGIN.name(), "success");
            auditLogService.record(AuditEvent.OTP_VERIFICATION_SUCCEEDED, "success",
                Map.of("purpose", OtpPurpose.LOGIN.name()));
            TenSignal tenSignal = tenSignalRepository.findFirstByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new EmailNotFoundException("No account exists for this email address."));
            LoginResponse response = new LoginResponse(ownerSessionService.issue(tenSignal), tenSignal.getPublicSlug(), tenSignal.getPreferredLocale());
            metrics.login("success");
            auditLogService.record(AuditEvent.AUTHENTICATION_SUCCEEDED, "success");
            return response;
        } catch (RuntimeException ex) {
            if (!otpVerified) {
                metrics.otpVerification(OtpPurpose.LOGIN.name(), "failure");
                auditLogService.record(AuditEvent.OTP_VERIFICATION_FAILED, "failure",
                    Map.of("purpose", OtpPurpose.LOGIN.name()));
            }
            metrics.login("failure");
            auditLogService.record(AuditEvent.AUTHENTICATION_FAILED, "failure");
            throw ex;
        }
    }

    @Transactional
    public void consumeGrant(String rawGrant, String email, OtpPurpose expectedPurpose, UUID expectedOwnerId) {
        if (rawGrant == null || rawGrant.isBlank()) {
            throw invalidGrant();
        }
        String normalizedEmail = normalizeEmail(email);
        VerificationGrant grant = grantRepository.findByHashForUpdate(tokenHashingService.hashToken(rawGrant))
            .orElseThrow(this::invalidGrant);
        Instant now = clock.instant();
        if (grant.getConsumedAt() != null || !grant.getExpiresAt().isAfter(now)
            || grant.getPurpose() != expectedPurpose || !grant.getEmail().equals(normalizedEmail)
            || !Objects.equals(grant.getOwnerProfileId(), expectedOwnerId)) {
            throw invalidGrant();
        }
        grant.setConsumedAt(now);
        grantRepository.save(grant);
    }

    private void verifyAndConsumeChallenge(String email, String code, OtpPurpose purpose, UUID ownerId) {
        OtpChallenge challenge = challengeRepository.findByKeyForUpdate(challengeKey(email, purpose, ownerId))
            .orElseThrow(this::invalidCode);
        Instant now = clock.instant();
        if (challenge.getConsumedAt() != null || !challenge.getExpiresAt().isAfter(now)
            || challenge.getFailedAttempts() >= maxAttempts) {
            throw invalidCode();
        }
        if (!secretHashingService.matches(code == null ? "" : code.trim(), challenge.getCodeHash())) {
            challenge.setFailedAttempts(challenge.getFailedAttempts() + 1);
            if (challenge.getFailedAttempts() >= maxAttempts) {
                challenge.setConsumedAt(now);
            }
            challengeRepository.save(challenge);
            throw invalidCode();
        }
        challenge.setConsumedAt(now);
        challengeRepository.save(challenge);
    }

    private String issueGrant(String email, OtpPurpose purpose, UUID ownerId) {
        String raw = tokenHashingService.generateRawToken();
        grantRepository.save(VerificationGrant.builder()
            .tokenHash(tokenHashingService.hashToken(raw))
            .email(email)
            .purpose(purpose)
            .ownerProfileId(ownerId)
            .expiresAt(clock.instant().plus(grantTtl))
            .build());
        return raw;
    }

    private UUID validatePurposeAndResolveOwner(String email, OtpPurpose purpose, String ownerToken) {
        if (purpose == OtpPurpose.EMAIL_CHANGE) {
            TenSignal tenSignal = ownerSessionService.authenticate(ownerToken);
            String currentEmail = tenSignal.getEmail();
            if (currentEmail != null && currentEmail.equalsIgnoreCase(email)) {
                throw new IllegalArgumentException("Yeni e-posta adresi mevcut e-posta adresinizle aynı olamaz.");
            }
            Optional<TenSignal> existingTenSignal = tenSignalRepository.findByEmail(email);
            if (existingTenSignal.isPresent() && !existingTenSignal.get().getId().equals(tenSignal.getId())) {
                throw new EmailAlreadyExistsException("Bu e-posta adresi başka bir hesap tarafından kullanılıyor.");
            }
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent() && (tenSignal.getUser() == null || !existingUser.get().getId().equals(tenSignal.getUser().getId()))) {
                throw new EmailAlreadyExistsException("Bu e-posta adresi başka bir hesap tarafından kullanılıyor.");
            }
            return tenSignal.getId();
        }
        boolean exists = tenSignalRepository.existsByEmail(email);
        if (purpose == OtpPurpose.LOGIN && !exists) {
            throw new EmailNotFoundException("No account exists for this email address.");
        }
        if (purpose == OtpPurpose.REGISTER && exists) {
            throw new EmailAlreadyExistsException("An account already exists for this email address.");
        }
        return null;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOtpDeliveryStatus(String email, OtpPurpose purpose, String ownerToken) {
        String normalizedEmail = normalizeEmail(email);
        UUID ownerId = null;
        if (purpose == OtpPurpose.EMAIL_CHANGE) {
            TenSignal tenSignal = ownerSessionService.authenticate(ownerToken);
            ownerId = tenSignal.getId();
        }

        String key = challengeKey(normalizedEmail, purpose, ownerId);
        OtpChallenge challenge = challengeRepository.findById(key).orElse(null);
        if (challenge == null) {
            return Map.of("deliveryStatus", "NOT_FOUND");
        }

        NotificationType type = switch (purpose) {
            case REGISTER -> NotificationType.REGISTRATION_VERIFICATION;
            case LOGIN -> NotificationType.LOGIN_VERIFICATION;
            case EMAIL_CHANGE -> NotificationType.EMAIL_CHANGE_VERIFICATION;
        };

        String recipientHash = EmailNotificationService.hashRecipient(normalizedEmail);
        Optional<EmailOutboxEntity> latestOutbox = outboxRepository.findLatestByRecipientHashAndType(recipientHash, type.name());

        if (latestOutbox.isEmpty()) {
            return Map.of("deliveryStatus", "PENDING");
        }

        EmailOutboxEntity entity = latestOutbox.get();
        EmailOutboxStatus status = entity.getStatus();

        if (status == EmailOutboxStatus.FAILED) {
            return Map.of(
                "deliveryStatus", "FAILED",
                "message", "Doğrulama e-postası teslim edilemedi. Lütfen sistem yöneticisi ile iletişime geçin veya e-posta adresini kontrol edin."
            );
        } else if (status == EmailOutboxStatus.SENT) {
            return Map.of("deliveryStatus", "DELIVERED");
        } else {
            return Map.of("deliveryStatus", "PENDING");
        }
    }

    private String challengeKey(String email, OtpPurpose purpose, UUID ownerId) {
        return tokenHashingService.hashToken(purpose.name() + "|" + email + "|" + (ownerId == null ? "-" : ownerId));
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private VerificationException invalidCode() {
        return new VerificationException("Verification code is invalid, expired, consumed, or has exceeded its attempt limit.");
    }

    private VerificationException invalidGrant() {
        return new VerificationException("Verification grant is invalid, expired, consumed, or does not match this operation.");
    }
}
