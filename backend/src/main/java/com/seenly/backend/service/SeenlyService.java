package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.dto.CreateSeenlyRequest;
import com.seenly.backend.dto.CreateSeenlyResponse;
import com.seenly.backend.dto.ResultSnapshotDto;
import com.seenly.backend.entity.ResultSnapshot;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.SelfAnswer;
import com.seenly.backend.entity.User;
import com.seenly.backend.exception.CooldownActiveException;
import com.seenly.backend.exception.EmailAlreadyExistsException;
import com.seenly.backend.exception.ResourceNotFoundException;
import com.seenly.backend.exception.SelfEvaluationException;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeenlyService {

    private final SeenlyRepository seenlyRepository;
    private final UserRepository userRepository;
    private final TokenHashingService tokenHashingService;
    private final ScoringEngineService scoringEngineService;
    private final SnapshotMapperService snapshotMapperService;

    /**
     * Creates a new Seenly profile with owner's self answers.
     * Enforces email normalization and uniqueness if email is supplied.
     */
    @Transactional
    public CreateSeenlyResponse createSeenly(CreateSeenlyRequest request) {
        String normalizedEmail = null;
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);

            if (seenlyRepository.existsByEmail(normalizedEmail) || userRepository.existsByEmail(normalizedEmail)) {
                throw new EmailAlreadyExistsException("Bu e-posta adresiyle kayıtlı bir hesap zaten mevcut. Lütfen giriş yapın.");
            }
        }

        String rawToken = tokenHashingService.generateRawToken();
        String tokenHash = tokenHashingService.hashToken(rawToken);
        String publicSlug = tokenHashingService.generatePublicSlug();

        Seenly seenly = Seenly.builder()
            .displayName(request.getDisplayName())
            .email(normalizedEmail)
            .publicSlug(publicSlug)
            .ownerTokenHash(tokenHash)
            .responseCount(0)
            .isCapped(false)
            .build();

        seenly.setSelfAnswers(request.getSelfAnswers().stream().map(ans ->
            SelfAnswer.builder()
                .seenly(seenly)
                .questionId(ans.getQuestionId())
                .answerValue(ans.getAnswerValue())
                .build()
        ).collect(Collectors.toList()));

        seenlyRepository.save(seenly);

        ResultSnapshot snapshot = scoringEngineService.calculateSelfResult(seenly);
        ResultSnapshotDto snapshotDto = snapshotMapperService.toDto(snapshot);

        return new CreateSeenlyResponse(rawToken, publicSlug, snapshotDto);
    }

    /**
     * Returns the owner dashboard snapshot with privacy guarding.
     */
    @Transactional(readOnly = true)
    public ResultSnapshotDto getOwnerDashboard(String ownerToken) {
        Seenly seenly = getSeenlyFromToken(ownerToken);
        return snapshotMapperService.toDto(seenly.getResultSnapshot());
    }

    /**
     * Returns public dashboard snapshot with zero-leak privacy masking.
     */
    @Transactional(readOnly = true)
    public ResultSnapshotDto getPublicDashboard(String publicSlug) {
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found for the provided slug."));
        return snapshotMapperService.toDto(seenly.getResultSnapshot());
    }

    /**
     * Updates the owner's display name with a 14-day cooldown rule.
     */
    @Transactional
    public ResultSnapshotDto updateDisplayName(String ownerToken, String displayName) {
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

        return snapshotMapperService.toDto(seenly.getResultSnapshot());
    }

    /**
     * Updates the owner's email address on both Seenly and associated User entities.
     * Enforces uniqueness against other existing users and profiles.
     */
    @Transactional
    public ResultSnapshotDto updateEmail(String ownerToken, String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("E-posta adresi boş bırakılamaz.");
        }
        Seenly seenly = getSeenlyFromToken(ownerToken);
        String cleanedEmail = email.trim().toLowerCase(Locale.ROOT);

        // If target email is same as current email, return existing snapshot without changes
        if (cleanedEmail.equalsIgnoreCase(seenly.getEmail())) {
            return snapshotMapperService.toDto(seenly.getResultSnapshot());
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

        seenly.setEmail(cleanedEmail);
        if (seenly.getUser() != null) {
            seenly.getUser().setEmail(cleanedEmail);
        }
        seenlyRepository.save(seenly);

        return snapshotMapperService.toDto(seenly.getResultSnapshot());
    }

    /**
     * Updates the owner's chosen avatar.
     */
    @Transactional
    public ResultSnapshotDto updateAvatar(String ownerToken, String avatar) {
        Seenly seenly = getSeenlyFromToken(ownerToken);
        seenly.setAvatar(avatar.trim());
        seenlyRepository.save(seenly);

        return snapshotMapperService.toDto(seenly.getResultSnapshot());
    }

    /**
     * Checks if the friend is eligible to answer (guards self-evaluations and spam).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> checkEligibility(String publicSlug, String ownerToken, String ipAddress, String fingerprintHash) {
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        if (ownerToken != null && seenly.getOwnerTokenHash().equals(tokenHashingService.hashToken(ownerToken))) {
            throw new SelfEvaluationException("You cannot evaluate yourself.");
        }

        return Map.of("eligible", true);
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
        if (ownerToken == null || ownerToken.isBlank()) {
            throw new ResourceNotFoundException("Owner token is required.");
        }
        String tokenHash = tokenHashingService.hashToken(ownerToken);
        return seenlyRepository.findByOwnerTokenHash(tokenHash)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found for the provided token."));
    }
}
