package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.constant.OtpPurpose;
import com.seenly.backend.dto.CreateSeenlyRequest;
import com.seenly.backend.dto.CreateSeenlyResponse;
import com.seenly.backend.dto.EligibilityResponseDto;
import com.seenly.backend.dto.OwnerDashboardDto;
import com.seenly.backend.dto.PublicProfileDto;
import com.seenly.backend.dto.OwnerResponseHistoryPageDto;
import com.seenly.backend.dto.ResponseSessionDto;
import com.seenly.backend.entity.ResultSnapshot;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.SelfAnswer;
import com.seenly.backend.entity.User;
import com.seenly.backend.exception.CooldownActiveException;
import com.seenly.backend.exception.EmailAlreadyExistsException;
import com.seenly.backend.exception.ResourceNotFoundException;
import com.seenly.backend.exception.SelfEvaluationException;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import com.seenly.backend.repository.ResponseSessionRepository;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.observability.AuditLogService;
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

import com.seenly.backend.dto.NotificationPreferencesDto;
import com.seenly.backend.email.EmailNotificationService;
import com.seenly.backend.email.NotificationType;
import com.seenly.backend.email.UserNotificationPreferencesService;

import java.time.Clock;
import java.time.Duration;
import java.time.ZoneOffset;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeenlyService {

    private static final Pattern PARTICIPANT_SIGNAL_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{8,64}$");

    private final SeenlyRepository seenlyRepository;
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
    private final UserNotificationPreferencesService preferencesService;
    private final Clock clock;

    /**
     * Creates a new Seenly profile with owner's self answers.
     * Enforces email normalization and uniqueness if email is supplied.
     */
    @Transactional
    public CreateSeenlyResponse createSeenly(CreateSeenlyRequest request) {
        assessmentValidationService.validateSelfAnswers(request.getSelfAnswers());
        String normalizedEmail = null;
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

            authService.consumeGrant(request.getRegistrationGrant(), normalizedEmail, OtpPurpose.REGISTER, null);

            if (seenlyRepository.existsByEmail(normalizedEmail) || userRepository.existsByEmail(normalizedEmail)) {
                throw new EmailAlreadyExistsException("Bu e-posta adresiyle kayıtlı bir hesap zaten mevcut. Lütfen giriş yapın.");
            }
        }

        OwnerSessionService.SessionCredentials session = ownerSessionService.newCredentials();
        String publicSlug = tokenHashingService.generatePublicSlug();

        LocalDateTime nowDateTime = LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
        Seenly seenly = Seenly.builder()
            .displayName(request.getDisplayName())
            .email(normalizedEmail)
            .publicSlug(publicSlug)
            .ownerTokenHash(session.tokenHash())
            .ownerTokenExpiresAt(session.expiresAt())
            .responseCount(0)
            .isCapped(false)
            .lastActivityAt(nowDateTime)
            .build();

        seenly.setSelfAnswers(request.getSelfAnswers().stream().map(ans ->
            SelfAnswer.builder()
                .seenly(seenly)
                .questionId(ans.getQuestionId())
                .answerValue(ans.getAnswerValue())
                .build()
        ).collect(Collectors.toList()));

        seenlyRepository.save(seenly);

        if (normalizedEmail != null) {
            emailNotificationService.enqueue(
                NotificationType.FIRST_SHARE_REMINDER,
                normalizedEmail,
                null,
                "tr",
                Map.of("shareUrl", "https://seenly.app/p/" + publicSlug),
                "first-share-reminder:" + seenly.getId(),
                clock.instant().plus(Duration.ofHours(24)),
                null
            );
        }

        ResultSnapshot snapshot = scoringEngineService.calculateSelfResult(seenly);
        OwnerDashboardDto snapshotDto = snapshotMapperService.toOwnerDto(snapshot);
        auditLogService.record(AuditEvent.ACCOUNT_CREATED, "success");

        return new CreateSeenlyResponse(session.rawToken(), publicSlug, snapshotDto);
    }

    /**
     * Returns the owner dashboard snapshot with privacy guarding.
     */
    @Transactional(readOnly = true)
    public OwnerDashboardDto getOwnerDashboard(String ownerToken) {
        Seenly seenly = getSeenlyFromToken(ownerToken);
        return snapshotMapperService.toOwnerDto(seenly.getResultSnapshot());
    }

    @Transactional(readOnly = true)
    public OwnerResponseHistoryPageDto getOwnerResponseHistory(String ownerToken, String cursor, int limit) {
        Seenly seenly = getSeenlyFromToken(ownerToken);
        HistoryCursor before = decodeHistoryCursor(cursor);
        var slice = responseSessionRepository.findOwnerHistory(
            seenly.getId(), before == null ? null : before.createdAt(),
            before == null ? null : before.id(), PageRequest.of(0, Math.min(Math.max(limit, 1), 25)));
        Map<String, Integer> selfAnswers = new HashMap<>();
        if (seenly.getSelfAnswers() != null) {
            for (SelfAnswer answer : seenly.getSelfAnswers()) {
                selfAnswers.put(SnapshotMapperService.extractLensFromQuestionId(answer.getQuestionId()), answer.getAnswerValue());
            }
        }
        boolean isPremium = Boolean.TRUE.equals(seenly.getIsPremium());
        List<ResponseSessionDto> items = slice.getContent().stream()
            .map(session -> snapshotMapperService.toSessionDto(session, selfAnswers, isPremium))
            .toList();
        String next = slice.hasNext() && !slice.getContent().isEmpty()
            ? encodeHistoryCursor(slice.getContent().get(slice.getContent().size() - 1))
            : null;
        return new OwnerResponseHistoryPageDto(items, next, slice.hasNext(), seenly.getResponseCount());
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
        Seenly seenly = seenlyRepository.findPublicProfileBySlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found for the provided slug."));

        boolean isOwner = false;
        if (ownerToken != null && !ownerToken.isBlank()) {
            isOwner = ownerSessionService.matchesActiveOwner(seenly, ownerToken.trim());
        }

        boolean isParticipant = false;
        if (participantSignal != null) {
            String trimmedSignal = participantSignal.trim();
            if (PARTICIPANT_SIGNAL_PATTERN.matcher(trimmedSignal).matches()) {
                String hashedSignal = abuseSignalService.fingerprintHash(trimmedSignal);
                isParticipant = responseSessionRepository.existsBySeenlyIdAndFingerprintHash(seenly.getId(), hashedSignal);
            }
        }

        boolean isAuthorizedViewer = isOwner || isParticipant;
        boolean thresholdMet = seenly.getResponseCount() >= AppConstants.MIN_RESPONSES_FOR_OUTSIDE;

        boolean outsidePerceptionAllowed = isAuthorizedViewer && thresholdMet;
        String lockReason = null;
        if (!isAuthorizedViewer) {
            lockReason = "COMPLETE_TEST_REQUIRED";
        } else if (!thresholdMet) {
            lockReason = "INSUFFICIENT_RESPONSES";
        }

        return snapshotMapperService.toPublicDto(seenly.getResultSnapshot(), outsidePerceptionAllowed, lockReason);
    }

    /**
     * Updates the owner's display name with a 14-day cooldown rule.
     */
    @Transactional
    public OwnerDashboardDto updateDisplayName(String ownerToken, String displayName) {
        Seenly seenly = getSeenlyFromToken(ownerToken);

        if (seenly.getLastNameChangedAt() != null) {
            LocalDateTime nextAllowedDate = seenly.getLastNameChangedAt().plusDays(AppConstants.NAME_CHANGE_COOLDOWN_DAYS);
            if (LocalDateTime.now().isBefore(nextAllowedDate)) {
                long daysRemaining = ChronoUnit.DAYS.between(LocalDateTime.now(), nextAllowedDate) + 1;
                throw new CooldownActiveException(
                    "İsminizi 14 günde bir değiştirebilirsiniz. Kalan süre: " + daysRemaining + " gün.",
                    nextAllowedDate,
                    daysRemaining
                );
            }
        }

        seenly.setDisplayName(displayName.trim());
        seenly.setLastNameChangedAt(LocalDateTime.now());
        seenlyRepository.save(seenly);
        auditLogService.record(AuditEvent.EMAIL_CHANGED, "success");

        return snapshotMapperService.toOwnerDto(seenly.getResultSnapshot());
    }

    /**
     * Updates the owner's email address on both Seenly and associated User entities.
     * Enforces uniqueness against other existing users and profiles.
     */
    @Transactional
    public OwnerDashboardDto updateEmail(String ownerToken, String email, String verificationGrant) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("E-posta adresi boş bırakılamaz.");
        }
        Seenly seenly = getSeenlyFromToken(ownerToken);
        String cleanedEmail = email.trim().toLowerCase(Locale.ROOT);

        authService.consumeGrant(verificationGrant, cleanedEmail, OtpPurpose.EMAIL_CHANGE, seenly.getId());

        // If target email is same as current email, return existing snapshot without changes
        if (cleanedEmail.equalsIgnoreCase(seenly.getEmail())) {
            return snapshotMapperService.toOwnerDto(seenly.getResultSnapshot());
        }

        // Check if another Seenly profile owns this email
        Optional<Seenly> existingSeenly = seenlyRepository.findByEmail(cleanedEmail);
        if (existingSeenly.isPresent() && !existingSeenly.get().getId().equals(seenly.getId())) {
            throw new EmailAlreadyExistsException("Bu e-posta adresi başka bir hesap tarafından kullanılıyor.");
        }

        // Check if another User owns this email
        Optional<User> existingUser = userRepository.findByEmail(cleanedEmail);
        if (existingUser.isPresent() && (seenly.getUser() == null || !existingUser.get().getId().equals(seenly.getUser().getId()))) {
            throw new EmailAlreadyExistsException("Bu e-posta adresi başka bir hesap tarafından kullanılıyor.");
        }

        String oldEmail = seenly.getEmail();
        seenly.setEmail(cleanedEmail);
        if (seenly.getUser() != null) {
            seenly.getUser().setEmail(cleanedEmail);
        }
        seenlyRepository.save(seenly);

        if (oldEmail != null && !oldEmail.equalsIgnoreCase(cleanedEmail)) {
            emailNotificationService.enqueue(
                NotificationType.EMAIL_CHANGED,
                oldEmail,
                seenly.getUser() != null ? seenly.getUser().getId() : null,
                "tr",
                Map.of("securityUrl", "https://seenly.app/settings/security"),
                "email-changed:" + seenly.getId() + ":" + EmailNotificationService.hashRecipient(oldEmail) + ":" + clock.instant().toEpochMilli(),
                clock.instant(),
                null
            );
        }

        return snapshotMapperService.toOwnerDto(seenly.getResultSnapshot());
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesDto getNotificationPreferences(String ownerToken) {
        Seenly seenly = getSeenlyFromToken(ownerToken);
        return preferencesService.getPreferences(seenly.getUser());
    }

    @Transactional
    public NotificationPreferencesDto updateNotificationPreferences(String ownerToken, NotificationPreferencesDto dto) {
        Seenly seenly = getSeenlyFromToken(ownerToken);
        if (seenly.getUser() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile must have an active user account to configure preferences");
        }
        return preferencesService.updatePreferences(seenly.getUser(), dto);
    }

    /**
     * Updates the owner's chosen avatar.
     */
    @Transactional
    public OwnerDashboardDto updateAvatar(String ownerToken, String avatar) {
        Seenly seenly = getSeenlyFromToken(ownerToken);
        seenly.setAvatar(avatar.trim());
        seenlyRepository.save(seenly);

        return snapshotMapperService.toOwnerDto(seenly.getResultSnapshot());
    }

    /**
     * Checks if the friend is eligible to answer (guards self-evaluations and spam).
     */
    @Transactional(readOnly = true)
    public EligibilityResponseDto checkEligibility(String publicSlug, String ownerToken, String fingerprintHash) {
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        if (ownerSessionService.matchesActiveOwner(seenly, ownerToken)) {
            throw new SelfEvaluationException("You cannot evaluate yourself.");
        }
        String storedFingerprint = abuseSignalService.fingerprintHash(fingerprintHash);
        return new EligibilityResponseDto(
            !responseSessionRepository.existsBySeenlyIdAndFingerprintHash(seenly.getId(), storedFingerprint));
    }

    /**
     * Increments the total profile click count for the given slug.
     */
    @Transactional
    public int incrementProfileClick(String publicSlug) {
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found."));
        seenly.setTotalProfileClicks(seenly.getTotalProfileClicks() + 1);
        seenlyRepository.save(seenly);
        return seenly.getTotalProfileClicks();
    }

    private Seenly getSeenlyFromToken(String ownerToken) {
        return ownerSessionService.authenticate(ownerToken);
    }
}
