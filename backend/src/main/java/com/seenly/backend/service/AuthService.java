package com.seenly.backend.service;

import com.seenly.backend.constant.OtpPurpose;
import com.seenly.backend.dto.LoginResponse;
import com.seenly.backend.dto.OtpVerificationResponse;
import com.seenly.backend.entity.OtpChallenge;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.VerificationGrant;
import com.seenly.backend.exception.EmailNotFoundException;
import com.seenly.backend.exception.EmailAlreadyExistsException;
import com.seenly.backend.exception.EmailDeliveryException;
import com.seenly.backend.exception.OtpCooldownException;
import com.seenly.backend.exception.VerificationException;
import com.seenly.backend.repository.OtpChallengeRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.VerificationGrantRepository;
import com.seenly.backend.observability.ApplicationMetrics;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.observability.AuditLogService;
import com.seenly.backend.observability.TransactionalObservability;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository challengeRepository;
    private final VerificationGrantRepository grantRepository;
    private final SeenlyRepository seenlyRepository;
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
        String normalizedEmail = normalizeEmail(email);
        UUID ownerId = validatePurposeAndResolveOwner(normalizedEmail, purpose, ownerToken);
        String key = challengeKey(normalizedEmail, purpose, ownerId);
        Instant now = clock.instant();

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

        try {
            otpDeliveryService.send(normalizedEmail, code, purpose);
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
            Seenly seenly = seenlyRepository.findFirstByEmailOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new EmailNotFoundException("No account exists for this email address."));
            LoginResponse response = new LoginResponse(ownerSessionService.issue(seenly), seenly.getPublicSlug());
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
            return ownerSessionService.authenticate(ownerToken).getId();
        }
        boolean exists = seenlyRepository.existsByEmail(email);
        if (purpose == OtpPurpose.LOGIN && !exists) {
            throw new EmailNotFoundException("No account exists for this email address.");
        }
        if (purpose == OtpPurpose.REGISTER && exists) {
            throw new EmailAlreadyExistsException("An account already exists for this email address.");
        }
        return null;
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
