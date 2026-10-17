package com.tensignal.backend.service;

import com.tensignal.backend.dto.FriendResponseInput;
import com.tensignal.backend.dto.ParticipantSubmissionResultDto;
import com.tensignal.backend.entity.FriendResponse;
import com.tensignal.backend.entity.ResponseSession;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.exception.DuplicateResponseException;
import com.tensignal.backend.exception.QuotaExceededException;
import com.tensignal.backend.exception.ResourceNotFoundException;
import com.tensignal.backend.exception.SelfEvaluationException;
import com.tensignal.backend.repository.ResponseSessionRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditEvent;
import com.tensignal.backend.observability.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tensignal.backend.email.EmailNotificationService;
import com.tensignal.backend.email.NotificationType;
import com.tensignal.backend.repository.EmailOutboxRepository;
import com.tensignal.backend.repository.UserRepository;

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
    private final TenSignalRepository tenSignalRepository;
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
    private final UserRepository userRepository;
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

        TenSignal tenSignal = tenSignalRepository.findByPublicSlugForUpdate(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("TenSignal not found"));
        if (ownerSessionService.matchesActiveOwner(tenSignal, ownerToken)) {
            reject("self_evaluation");
            throw new SelfEvaluationException("You cannot evaluate yourself.");
        }
        if (sessionRepository.existsBySeenlyIdAndFingerprintHash(tenSignal.getId(), fingerprintHash)) {
            duplicate();
            throw new DuplicateResponseException();
        }

        int totalAllowedCapacity = tenSignal.getIsPremium()
            ? Integer.MAX_VALUE
            : tenSignal.getBaseFormCapacity() + tenSignal.getPurchasedExtraCapacity();
        if (!tenSignal.getIsPremium() && (tenSignal.isCapped() || tenSignal.getResponseCount() >= totalAllowedCapacity)) {
            tenSignal.setCapped(true);
            metrics.participantSubmission("capacity_exhausted");
            auditLogService.record(AuditEvent.PARTICIPANT_SUBMISSION_REJECTED, "blocked",
                java.util.Map.of("reason", "capacity_exhausted"));
            throw new QuotaExceededException("This TenSignal profile has reached its maximum response capacity quota.");
        }

        ResponseSession session = ResponseSession.builder()
            .seenly(tenSignal)
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

        int prevCount = tenSignal.getResponseCount();
        int nextCount = prevCount + 1;
        tenSignal.setResponseCount(nextCount);
        tenSignal.setLastActivityAt(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC));
        if (!tenSignal.getIsPremium() && nextCount >= totalAllowedCapacity) {
            tenSignal.setCapped(true);
        } else {
            tenSignal.setCapped(false);
        }
        tenSignalRepository.saveAndFlush(tenSignal);
        scoringEngineService.recalculateResultSnapshot(tenSignal);

        // Cancel any pending inactivity reminder on activity
        emailOutboxRepository.cancelPendingByPrefix("inactivity-reminder:" + tenSignal.getId() + ":%", clock.instant());

        String email = tenSignal.getEmail();
        UUID userId = tenSignal.getUser() != null
            ? tenSignal.getUser().getId()
            : (email != null && !email.isBlank()
                ? userRepository.findByEmail(email.trim().toLowerCase(java.util.Locale.ROOT)).map(com.tensignal.backend.entity.User::getId).orElse(null)
                : null);

        if (email != null && !email.isBlank()) {
            Instant now = clock.instant();
            String recipientLocale = (tenSignal.getPreferredLocale() != null && (tenSignal.getPreferredLocale().equalsIgnoreCase("tr") || tenSignal.getPreferredLocale().equalsIgnoreCase("en")))
                ? tenSignal.getPreferredLocale().trim().toLowerCase(java.util.Locale.ROOT)
                : "en";

            // 1. Report Unlocked on exactly 2 -> 3 transition
            if (prevCount == 2 && nextCount == 3) {
                emailNotificationService.enqueue(
                    NotificationType.REPORT_UNLOCKED,
                    email,
                    userId,
                    recipientLocale,
                    Map.of("dashboardUrl", "https://tensignal.app/dashboard"),
                    "report-unlocked:" + tenSignal.getId(),
                    now,
                    null
                );
                // Cancel pending first-share reminder once 3 responses are received
                emailOutboxRepository.cancelPendingByPrefix("first-share-reminder:" + tenSignal.getId() + "%", now);
            }

            // 2. Debounce new evaluations (10 minute window)
            long windowEpoch = now.getEpochSecond() / 600;
            Instant scheduledEnd = Instant.ofEpochSecond((windowEpoch + 1) * 600);
            String debounceKey = "new-evaluation:" + tenSignal.getId() + ":" + windowEpoch;
            emailNotificationService.enqueue(
                NotificationType.NEW_EVALUATION,
                email,
                userId,
                recipientLocale,
                Map.of("count", 1, "dashboardUrl", "https://tensignal.app/dashboard"),
                debounceKey,
                scheduledEnd,
                null
            );

            // 3. Capacity alerts for non-premium profiles
            if (!tenSignal.getIsPremium() && totalAllowedCapacity > 0) {
                String capacityVersion = tenSignal.getBaseFormCapacity() + "_" + tenSignal.getPurchasedExtraCapacity();
                double prevRatio = (double) prevCount / totalAllowedCapacity;
                double nextRatio = (double) nextCount / totalAllowedCapacity;

                if (prevRatio < 0.8 && nextRatio >= 0.8 && nextRatio < 1.0) {
                    emailNotificationService.enqueue(
                        NotificationType.CAPACITY_80_PERCENT,
                        email,
                        userId,
                        recipientLocale,
                        Map.of("currentResponses", nextCount, "maxCapacity", totalAllowedCapacity, "upgradeUrl", "https://tensignal.app/pricing"),
                        "capacity-80:" + tenSignal.getId() + ":" + capacityVersion,
                        now,
                        null
                    );
                } else if (prevCount < totalAllowedCapacity && nextCount >= totalAllowedCapacity) {
                    emailNotificationService.enqueue(
                        NotificationType.CAPACITY_FULL,
                        email,
                        userId,
                        recipientLocale,
                        Map.of("maxCapacity", totalAllowedCapacity, "upgradeUrl", "https://tensignal.app/pricing"),
                        "capacity-full:" + tenSignal.getId() + ":" + capacityVersion,
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
