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

import java.util.HashMap;
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
        if (seenly.isCapped() || seenly.getResponseCount() >= totalAllowedCapacity) {
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

        int nextCount = seenly.getResponseCount() + 1;
        seenly.setResponseCount(nextCount);
        if (!seenly.getIsPremium() && nextCount >= totalAllowedCapacity) {
            seenly.setCapped(true);
        }
        seenlyRepository.saveAndFlush(seenly);
        scoringEngineService.recalculateResultSnapshot(seenly);

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
