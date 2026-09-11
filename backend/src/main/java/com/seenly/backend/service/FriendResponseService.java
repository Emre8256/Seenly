package com.seenly.backend.service;

import com.seenly.backend.dto.FriendResponseInput;
import com.seenly.backend.dto.ParticipantSubmissionResultDto;
import com.seenly.backend.entity.FriendResponse;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.exception.DuplicateResponseException;
import com.seenly.backend.exception.QuotaExceededException;
import com.seenly.backend.exception.ResourceNotFoundException;
import com.seenly.backend.exception.SelfEvaluationException;
import com.seenly.backend.repository.ResponseSessionRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.observability.ApplicationMetrics;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.seenly.backend.email.EmailNotificationService;
import com.seenly.backend.email.NotificationType;
import com.seenly.backend.repository.EmailOutboxRepository;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendResponseService {
    private final SeenlyRepository seenlyRepository;
    private final ResponseSessionRepository sessionRepository;
    private final ScoringEngineService scoringEngineService;
    private final ReaderGameService readerGameService;
    private final OwnerSessionService ownerSessionService;
    private final AbuseSignalService abuseSignalService;
    private final AssessmentValidationService assessmentValidationService;
    private final AuditLogService auditLogService;
    private final ApplicationMetrics metrics;
    private final EmailNotificationService emailNotificationService;
    private final EmailOutboxRepository emailOutboxRepository;
    private final Clock clock;

    /**
     * The target row lock serializes duplicate validation, capacity consumption,
     * response persistence, and snapshot recalculation for one profile.
     */
    @Transactional
    public ParticipantSubmissionResultDto processFriendSubmission(
            String publicSlug, String ownerToken, String remoteAddress, FriendResponseInput request) {
        try {
            assessmentValidationService.validateFriendSubmission(request);
        } catch (RuntimeException ex) {
            reject("validation");
            throw ex;
        }
        String fingerprintHash;
        try {
            fingerprintHash = abuseSignalService.fingerprintHash(request.getFingerprintHash());
        } catch (RuntimeException ex) {
            reject("fingerprint_validation");
            throw ex;
        }

        Seenly seenly = seenlyRepository.findByPublicSlugForUpdate(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));
        if (ownerSessionService.matchesActiveOwner(seenly, ownerToken)) {
            reject("self_evaluation");
            throw new SelfEvaluationException("You cannot evaluate yourself.");
        }
        if (sessionRepository.existsBySeenlyIdAndFingerprintHash(seenly.getId(), fingerprintHash)) {
            duplicate();
            throw new DuplicateResponseException();
        }

        int totalAllowedCapacity = seenly.getIsPremium()
            ? Integer.MAX_VALUE
            : seenly.getBaseFormCapacity() + seenly.getPurchasedExtraCapacity();
        if (!seenly.getIsPremium() && (seenly.isCapped() || seenly.getResponseCount() >= totalAllowedCapacity)) {
            seenly.setCapped(true);
            metrics.participantSubmission("capacity_exhausted");
            auditLogService.record(AuditEvent.PARTICIPANT_SUBMISSION_REJECTED, "blocked",
                java.util.Map.of("reason", "capacity_exhausted"));
            throw new QuotaExceededException("This Seenly profile has reached its maximum response capacity quota.");
        }

        ResponseSession session = ResponseSession.builder()
            .seenly(seenly)
            .nickname(request.getNickname() == null ? null : request.getNickname().trim())
            .fingerprintHash(fingerprintHash)
            .ipAddress(abuseSignalService.networkHash(remoteAddress))
            .friendTimeAnalytics(request.getFriendTimeAnalytics() == null
                ? new HashMap<>() : new HashMap<>(request.getFriendTimeAnalytics()))
            .build();
        session.setResponses(request.getFriendResponses().stream().map(answer -> FriendResponse.builder()
            .responseSession(session)
            .questionId(answer.getQuestionId())
            .answerValue(answer.getAnswerValue())
            .build()).collect(Collectors.toList()));

        try {
            sessionRepository.saveAndFlush(session);
        } catch (DataIntegrityViolationException ex) {
            duplicate();
            throw new DuplicateResponseException();
        }

        int prevCount = seenly.getResponseCount();
        int nextCount = prevCount + 1;
        seenly.setResponseCount(nextCount);
        seenly.setLastActivityAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC));
        if (!seenly.getIsPremium() && nextCount >= totalAllowedCapacity) {
            seenly.setCapped(true);
        } else {
            seenly.setCapped(false);
        }
        seenlyRepository.saveAndFlush(seenly);
        scoringEngineService.recalculateResultSnapshot(seenly);

        // Cancel any pending inactivity reminder on activity
        emailOutboxRepository.cancelPendingByPrefix("inactivity-reminder:" + seenly.getId() + ":%", clock.instant());

        String email = seenly.getEmail();
        UUID userId = seenly.getUser() != null ? seenly.getUser().getId() : null;

        if (email != null && !email.isBlank()) {
            Instant now = clock.instant();

            // 1. Report Unlocked on exactly 2 -> 3 transition
            if (prevCount == 2 && nextCount == 3) {
                emailNotificationService.enqueue(
                    NotificationType.REPORT_UNLOCKED,
                    email,
                    userId,
                    "tr",
                    Map.of("dashboardUrl", "https://seenly.app/dashboard"),
                    "report-unlocked:" + seenly.getId(),
                    now,
                    null
                );
                // Cancel pending first-share reminder once 3 responses are received
                emailOutboxRepository.cancelPendingByPrefix("first-share-reminder:" + seenly.getId() + "%", now);
            }

            // 2. Debounce new evaluations (10 minute window)
            long windowEpoch = now.getEpochSecond() / 600;
            Instant scheduledEnd = Instant.ofEpochSecond((windowEpoch + 1) * 600);
            String debounceKey = "new-evaluation:" + seenly.getId() + ":" + windowEpoch;
            emailNotificationService.enqueue(
                NotificationType.NEW_EVALUATION,
                email,
                userId,
                "tr",
                Map.of("count", 1, "dashboardUrl", "https://seenly.app/dashboard"),
                debounceKey,
                scheduledEnd,
                null
            );

            // 3. Capacity alerts for non-premium profiles
            if (!seenly.getIsPremium() && totalAllowedCapacity > 0) {
                String capacityVersion = seenly.getBaseFormCapacity() + "_" + seenly.getPurchasedExtraCapacity();
                double prevRatio = (double) prevCount / totalAllowedCapacity;
                double nextRatio = (double) nextCount / totalAllowedCapacity;

                if (prevRatio < 0.8 && nextRatio >= 0.8 && nextRatio < 1.0) {
                    emailNotificationService.enqueue(
                        NotificationType.CAPACITY_80_PERCENT,
                        email,
                        userId,
                        "tr",
                        Map.of("currentResponses", nextCount, "maxCapacity", totalAllowedCapacity, "upgradeUrl", "https://seenly.app/pricing"),
                        "capacity-80:" + seenly.getId() + ":" + capacityVersion,
                        now,
                        null
                    );
                } else if (prevCount < totalAllowedCapacity && nextCount >= totalAllowedCapacity) {
                    emailNotificationService.enqueue(
                        NotificationType.CAPACITY_FULL,
                        email,
                        userId,
                        "tr",
                        Map.of("maxCapacity", totalAllowedCapacity, "upgradeUrl", "https://seenly.app/pricing"),
                        "capacity-full:" + seenly.getId() + ":" + capacityVersion,
                        now,
                        null
                    );
                }
            }
        }

        String styleId = readerGameService.calculateReaderStyle(session);
        double accuracy = readerGameService.calculatePerceptionAccuracy(session);
        metrics.participantSubmission("accepted");
        auditLogService.record(AuditEvent.PARTICIPANT_SUBMISSION_ACCEPTED, "success");
        return new ParticipantSubmissionResultDto(styleId, 0, 1, accuracy);
    }

    private void duplicate() {
        metrics.participantSubmission("duplicate");
        auditLogService.record(AuditEvent.DUPLICATE_RESPONSE_REJECTED, "blocked");
    }

    private void reject(String reason) {
        metrics.participantSubmission("rejected");
        auditLogService.record(AuditEvent.PARTICIPANT_SUBMISSION_REJECTED, "failure",
            java.util.Map.of("reason", reason));
    }
}
