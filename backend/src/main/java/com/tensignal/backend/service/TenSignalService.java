package com.tensignal.backend.service;

import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.constant.OtpPurpose;
import com.tensignal.backend.dto.CreateTenSignalRequest;
import com.tensignal.backend.dto.CreateTenSignalResponse;
import com.tensignal.backend.dto.EligibilityResponseDto;
import com.tensignal.backend.dto.OwnerDashboardDto;
import com.tensignal.backend.dto.PublicProfileDto;
import com.tensignal.backend.dto.OwnerResponseHistoryPageDto;
import com.tensignal.backend.dto.ResponseSessionDto;
import com.tensignal.backend.entity.ResultSnapshot;
import com.tensignal.backend.entity.ResponseSession;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.SelfAnswer;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.exception.CooldownActiveException;
import com.tensignal.backend.exception.EmailAlreadyExistsException;
import com.tensignal.backend.exception.ResourceNotFoundException;
import com.tensignal.backend.exception.SelfEvaluationException;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.repository.ResponseSessionRepository;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import com.tensignal.backend.dto.NotificationPreferencesDto;
import com.tensignal.backend.email.EmailNotificationService;
import com.tensignal.backend.email.NotificationType;
import com.tensignal.backend.email.UserNotificationPreferencesService;

import com.tensignal.backend.repository.EmailOutboxRepository;
import java.time.Instant;
import java.time.Clock;
import java.time.Duration;
import java.time.ZoneOffset;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenSignalService {

    private static final Pattern PARTICIPANT_SIGNAL_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{8,64}$");

    private final TenSignalRepository tenSignalRepository;
    private final UserRepository userRepository;
    private final TokenHashingService tokenHashingService;
    private final ScoringEngineService scoringEngineService;
    private final SnapshotMapperService snapshotMapperService;
    private final AuthService authService;
    private final OwnerSessionService ownerSessionService;
    private final AssessmentValidationService assessmentValidationService;
    private final AbuseSignalService abuseSignalService;
    private final ResponseSessionRepository responseSessionRepository;
    private final AuditLogService auditLogService;
    private final EmailNotificationService emailNotificationService;
    private final EmailOutboxRepository emailOutboxRepository;
    private final UserNotificationPreferencesService preferencesService;
    private final Clock clock;

    /**
     * Creates a new TenSignal profile with owner's self answers.
     * Enforces email normalization and uniqueness if email is supplied.
     */
    @Transactional
    public CreateTenSignalResponse createTenSignal(CreateTenSignalRequest request) {
        assessmentValidationService.validateSelfAnswers(request.getSelfAnswers());
        String normalizedEmail = null;
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

            authService.consumeGrant(request.getRegistrationGrant(), normalizedEmail, OtpPurpose.REGISTER, null);

            if (tenSignalRepository.existsByEmail(normalizedEmail) || userRepository.existsByEmail(normalizedEmail)) {
                throw new EmailAlreadyExistsException("Bu e-posta adresiyle kayıtlı bir hesap zaten mevcut. Lütfen giriş yapın.");
            }
        }

        OwnerSessionService.SessionCredentials session = ownerSessionService.newCredentials();
        String publicSlug = tokenHashingService.generatePublicSlug();

        LocalDateTime nowDateTime = LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
        TenSignal tenSignal = TenSignal.builder()
            .displayName(request.getDisplayName())
            .email(normalizedEmail)
            .publicSlug(publicSlug)
            .ownerTokenHash(session.tokenHash())
            .ownerTokenExpiresAt(session.expiresAt())
            .responseCount(0)
            .isCapped(false)
            .lastActivityAt(nowDateTime)
            .build();

        if (request.getLocale() != null && (request.getLocale().equalsIgnoreCase("tr") || request.getLocale().equalsIgnoreCase("en"))) {
            tenSignal.setPreferredLocale(request.getLocale().trim().toLowerCase(Locale.ROOT));
        }

        tenSignal.setSelfAnswers(request.getSelfAnswers().stream().map(ans ->
            SelfAnswer.builder()
                .seenly(tenSignal)
                .questionId(ans.getQuestionId())
                .answerValue(ans.getAnswerValue())
                .build()
        ).collect(Collectors.toList()));

        tenSignalRepository.save(tenSignal);

        if (normalizedEmail != null) {
            User user = ensureUserLinked(tenSignal);
            String reminderLocale = tenSignal.getPreferredLocale() != null ? tenSignal.getPreferredLocale() : "en";
            emailNotificationService.enqueue(
                NotificationType.FIRST_SHARE_REMINDER,
                normalizedEmail,
                user.getId(),
                reminderLocale,
                Map.of("shareUrl", "https://10signal.me/p/" + publicSlug),
                "first-share-reminder:" + tenSignal.getId(),
                clock.instant().plus(Duration.ofHours(24)),
                null
            );
        }

        ResultSnapshot snapshot = scoringEngineService.calculateSelfResult(tenSignal);
        OwnerDashboardDto snapshotDto = snapshotMapperService.toOwnerDto(snapshot);
        auditLogService.record(AuditEvent.ACCOUNT_CREATED, "success");

        return new CreateTenSignalResponse(session.rawToken(), publicSlug, snapshotDto);
    }

    /**
     * Returns the owner dashboard snapshot with privacy guarding.
     */
    @Transactional(readOnly = true)
    public OwnerDashboardDto getOwnerDashboard(String ownerToken) {
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);
        return snapshotMapperService.toOwnerDto(tenSignal.getResultSnapshot());
    }

    @Transactional(readOnly = true)
    public OwnerResponseHistoryPageDto getOwnerResponseHistory(String ownerToken, String cursor, int limit) {
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);
        HistoryCursor before = decodeHistoryCursor(cursor);
        var slice = responseSessionRepository.findOwnerHistory(
            tenSignal.getId(), before == null ? null : before.createdAt(),
            before == null ? null : before.id(), PageRequest.of(0, Math.min(Math.max(limit, 1), 25)));
        Map<String, Integer> selfAnswers = new HashMap<>();
        if (tenSignal.getSelfAnswers() != null) {
            for (SelfAnswer answer : tenSignal.getSelfAnswers()) {
                selfAnswers.put(SnapshotMapperService.extractLensFromQuestionId(answer.getQuestionId()), answer.getAnswerValue());
            }
        }
        boolean isPremium = Boolean.TRUE.equals(tenSignal.getIsPremium());
        List<ResponseSessionDto> items = slice.getContent().stream()
            .map(session -> snapshotMapperService.toSessionDto(session, selfAnswers, isPremium))
            .toList();
        String next = slice.hasNext() && !slice.getContent().isEmpty()
            ? encodeHistoryCursor(slice.getContent().get(slice.getContent().size() - 1))
            : null;
        return new OwnerResponseHistoryPageDto(items, next, slice.hasNext(), tenSignal.getResponseCount());
    }

    private String encodeHistoryCursor(ResponseSession session) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(
            (session.getCreatedAt() + "|" + session.getId()).getBytes(StandardCharsets.UTF_8));
    }

    private HistoryCursor decodeHistoryCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return null;
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|", -1);
            if (parts.length != 2) throw new IllegalArgumentException("Invalid response-history cursor.");
            return new HistoryCursor(LocalDateTime.parse(parts[0]), UUID.fromString(parts[1]));
        } catch (IllegalArgumentException | DateTimeParseException ex) {
            throw new IllegalArgumentException("Invalid response-history cursor.");
        }
    }

    private record HistoryCursor(LocalDateTime createdAt, UUID id) {}

    /**
     * Fail-closed overload: unauthenticated callers are locked by default with COMPLETE_TEST_REQUIRED.
     */
    @Transactional(readOnly = true)
    public PublicProfileDto getPublicDashboard(String publicSlug) {
        return getPublicDashboard(publicSlug, null, null);
    }

    /**
     * Returns public dashboard snapshot with strict server-side access control for outside perception.
     * Outside perception data is only revealed if:
     * 1. Viewer is verified participant (via hashed signal match on target profile) OR verified active owner.
     * 2. Response threshold (>= 3) is met.
     */
    @Transactional(readOnly = true)
    public PublicProfileDto getPublicDashboard(String publicSlug, String participantSignal, String ownerToken) {
        TenSignal tenSignal = tenSignalRepository.findPublicProfileBySlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("TenSignal profile not found for the provided slug."));

        boolean isOwner = false;
        if (ownerToken != null && !ownerToken.isBlank()) {
            isOwner = ownerSessionService.matchesActiveOwner(tenSignal, ownerToken.trim());
        }

        boolean isParticipant = false;
        if (participantSignal != null) {
            String trimmedSignal = participantSignal.trim();
            if (PARTICIPANT_SIGNAL_PATTERN.matcher(trimmedSignal).matches()) {
                String hashedSignal = abuseSignalService.fingerprintHash(trimmedSignal);
                isParticipant = responseSessionRepository.existsBySeenlyIdAndFingerprintHash(tenSignal.getId(), hashedSignal);
            }
        }

        boolean isAuthorizedViewer = isOwner || isParticipant;
        boolean thresholdMet = tenSignal.getResponseCount() >= AppConstants.MIN_RESPONSES_FOR_OUTSIDE;

        boolean outsidePerceptionAllowed = isAuthorizedViewer && thresholdMet;
        String lockReason = null;
        if (!isAuthorizedViewer) {
            lockReason = "COMPLETE_TEST_REQUIRED";
        } else if (!thresholdMet) {
            lockReason = "INSUFFICIENT_RESPONSES";
        }

        return snapshotMapperService.toPublicDto(tenSignal.getResultSnapshot(), outsidePerceptionAllowed, lockReason);
    }

    /**
     * Updates the owner's display name with a 14-day cooldown rule.
     */
    @Transactional
    public OwnerDashboardDto updateDisplayName(String ownerToken, String displayName) {
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);

        if (tenSignal.getLastNameChangedAt() != null) {
            LocalDateTime nextAllowedDate = tenSignal.getLastNameChangedAt().plusDays(AppConstants.NAME_CHANGE_COOLDOWN_DAYS);
            if (LocalDateTime.now().isBefore(nextAllowedDate)) {
                long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), nextAllowedDate) + 1;
                throw new CooldownActiveException(
                    "İsminizi 14 günde bir değiştirebilirsiniz. Kalan süre: " + daysRemaining + " gün.",
                    nextAllowedDate,
                    daysRemaining
                );
            }
        }

        tenSignal.setDisplayName(displayName.trim());
        tenSignal.setLastNameChangedAt(LocalDateTime.now());
        tenSignalRepository.save(tenSignal);

        return snapshotMapperService.toOwnerDto(tenSignal.getResultSnapshot());
    }

    /**
     * Updates the owner's email address on both TenSignal and associated User entities.
     * Enforces uniqueness against other existing users and profiles.
     */
    @Transactional
    public OwnerDashboardDto updateEmail(String ownerToken, String email, String verificationGrant) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("E-posta adresi boş bırakılamaz.");
        }
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);
        String cleanedEmail = email.trim().toLowerCase(Locale.ROOT);

        authService.consumeGrant(verificationGrant, cleanedEmail, OtpPurpose.EMAIL_CHANGE, tenSignal.getId());

        // If target email is same as current email, return existing snapshot without changes
        if (cleanedEmail.equalsIgnoreCase(tenSignal.getEmail())) {
            return snapshotMapperService.toOwnerDto(tenSignal.getResultSnapshot());
        }

        // Check if another TenSignal profile owns this email
        Optional<TenSignal> existingTenSignal = tenSignalRepository.findByEmail(cleanedEmail);
        if (existingTenSignal.isPresent() && !existingTenSignal.get().getId().equals(tenSignal.getId())) {
            throw new EmailAlreadyExistsException("Bu e-posta adresi başka bir hesap tarafından kullanılıyor.");
        }

        // Check if another User owns this email
        Optional<User> existingUser = userRepository.findByEmail(cleanedEmail);
        if (existingUser.isPresent() && (tenSignal.getUser() == null || !existingUser.get().getId().equals(tenSignal.getUser().getId()))) {
            throw new EmailAlreadyExistsException("Bu e-posta adresi başka bir hesap tarafından kullanılıyor.");
        }

        String oldEmail = tenSignal.getEmail();
        tenSignal.setEmail(cleanedEmail);
        if (tenSignal.getUser() != null) {
            tenSignal.getUser().setEmail(cleanedEmail);
            userRepository.save(tenSignal.getUser());
        }
        tenSignalRepository.save(tenSignal);

        // Security Audit Log with redacted PII
        auditLogService.record(AuditEvent.EMAIL_CHANGED, "success", Map.of(
            "tenSignalId", tenSignal.getId().toString(),
            "oldEmail", EmailNotificationService.redactEmail(oldEmail),
            "newEmail", EmailNotificationService.redactEmail(cleanedEmail)
        ));

        // Redirect any pending non-security notifications for this account to the new email
        Instant now = clock.instant();
        String newHash = EmailNotificationService.hashRecipient(cleanedEmail);
        UUID userId = tenSignal.getUser() != null ? tenSignal.getUser().getId() : null;
        String keyPrefix = "%:" + tenSignal.getId() + "%";
        emailOutboxRepository.redirectPendingRecipientForAccount(userId, keyPrefix, cleanedEmail, newHash, now);

        if (oldEmail != null && !oldEmail.equalsIgnoreCase(cleanedEmail)) {
            String alertLocale = tenSignal.getPreferredLocale() != null ? tenSignal.getPreferredLocale() : "en";
            emailNotificationService.enqueue(
                NotificationType.EMAIL_CHANGED,
                oldEmail,
                tenSignal.getUser() != null ? tenSignal.getUser().getId() : null,
                alertLocale,
                Map.of("securityUrl", "https://10signal.me/settings/security"),
                "email-changed:" + tenSignal.getId() + ":" + EmailNotificationService.hashRecipient(oldEmail) + ":" + clock.instant().toEpochMilli(),
                clock.instant(),
                null
            );
        }

        return snapshotMapperService.toOwnerDto(tenSignal.getResultSnapshot());
    }

    /**
     * Updates the owner's preferred locale.
     */
    @Transactional
    public OwnerDashboardDto updateLocale(String ownerToken, String rawLocale) {
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);
        if (rawLocale == null || (!rawLocale.equalsIgnoreCase("tr") && !rawLocale.equalsIgnoreCase("en"))) {
            throw new IllegalArgumentException("Supported locales are 'tr' and 'en'");
        }
        String normalized = rawLocale.trim().toLowerCase(Locale.ROOT);
        tenSignal.setPreferredLocale(normalized);
        if (tenSignal.getUser() != null) {
            tenSignal.getUser().setPreferredLocale(normalized);
            userRepository.save(tenSignal.getUser());
        }
        tenSignalRepository.save(tenSignal);

        if (tenSignal.getResultSnapshot() == null) {
            return OwnerDashboardDto.builder()
                .preferredLocale(tenSignal.getPreferredLocale())
                .displayName(tenSignal.getDisplayName())
                .publicSlug(tenSignal.getPublicSlug())
                .build();
        }
        return snapshotMapperService.toOwnerDto(tenSignal.getResultSnapshot());
    }

    @Transactional
    public NotificationPreferencesDto getNotificationPreferences(String ownerToken) {
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);
        User user = tenSignal.getUser();
        if (user == null && tenSignal.getEmail() != null && !tenSignal.getEmail().isBlank()) {
            user = ensureUserLinked(tenSignal);
        }
        return preferencesService.getPreferences(user);
    }

    @Transactional
    public NotificationPreferencesDto updateNotificationPreferences(String ownerToken, NotificationPreferencesDto dto) {
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);
        User user = tenSignal.getUser();
        if (user == null && tenSignal.getEmail() != null && !tenSignal.getEmail().isBlank()) {
            user = ensureUserLinked(tenSignal);
        }
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile must have an email to configure notification preferences");
        }
        return preferencesService.updatePreferences(user, dto);
    }

    private User ensureUserLinked(TenSignal tenSignal) {
        String normalizedEmail = tenSignal.getEmail().trim().toLowerCase(java.util.Locale.ROOT);
        User user = userRepository.findByEmail(normalizedEmail)
            .orElseGet(() -> userRepository.save(User.builder()
                .email(normalizedEmail)
                .emailVerified(true)
                .preferredLocale(tenSignal.getPreferredLocale())
                .build()));
        if (user.getPreferredLocale() == null && tenSignal.getPreferredLocale() != null) {
            user.setPreferredLocale(tenSignal.getPreferredLocale());
            userRepository.save(user);
        } else if (tenSignal.getPreferredLocale() == null && user.getPreferredLocale() != null) {
            tenSignal.setPreferredLocale(user.getPreferredLocale());
        }
        tenSignal.setUser(user);
        tenSignalRepository.save(tenSignal);
        return user;
    }

    /**
     * Updates the owner's chosen avatar.
     */
    @Transactional
    public OwnerDashboardDto updateAvatar(String ownerToken, String avatar) {
        TenSignal tenSignal = getTenSignalFromToken(ownerToken);
        tenSignal.setAvatar(avatar.trim());
        tenSignalRepository.save(tenSignal);

        return snapshotMapperService.toOwnerDto(tenSignal.getResultSnapshot());
    }

    /**
     * Checks if the friend is eligible to answer (guards self-evaluations and spam).
     */
    @Transactional(readOnly = true)
    public EligibilityResponseDto checkEligibility(String publicSlug, String ownerToken, String fingerprintHash) {
        TenSignal tenSignal = tenSignalRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("TenSignal not found"));

        if (ownerSessionService.matchesActiveOwner(tenSignal, ownerToken)) {
            throw new SelfEvaluationException("You cannot evaluate yourself.");
        }
        String storedFingerprint = abuseSignalService.fingerprintHash(fingerprintHash);
        return new EligibilityResponseDto(
            !responseSessionRepository.existsBySeenlyIdAndFingerprintHash(tenSignal.getId(), storedFingerprint));
    }

    /**
     * Increments the total profile click count for the given slug.
     */
    @Transactional
    public int incrementProfileClick(String publicSlug) {
        TenSignal tenSignal = tenSignalRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("TenSignal profile not found."));
        tenSignal.setTotalProfileClicks(tenSignal.getTotalProfileClicks() + 1);
        tenSignalRepository.save(tenSignal);
        return tenSignal.getTotalProfileClicks();
    }

    private TenSignal getTenSignalFromToken(String ownerToken) {
        return ownerSessionService.authenticate(ownerToken);
    }
}
