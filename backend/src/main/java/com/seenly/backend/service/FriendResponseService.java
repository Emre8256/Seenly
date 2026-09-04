package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.dto.FriendResponseInput;
import com.seenly.backend.dto.ResultSnapshotDto;
import com.seenly.backend.dto.SubmitResponseResult;
import com.seenly.backend.entity.FriendResponse;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.exception.QuotaExceededException;
import com.seenly.backend.exception.ResourceNotFoundException;
import com.seenly.backend.exception.SelfEvaluationException;
import com.seenly.backend.repository.ResponseSessionRepository;
import com.seenly.backend.repository.SeenlyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FriendResponseService {

    private final SeenlyRepository seenlyRepository;
    private final ResponseSessionRepository sessionRepository;
    private final ScoringEngineService scoringEngineService;
    private final ReaderGameService readerGameService;
    private final TokenHashingService tokenHashingService;
    private final SnapshotMapperService snapshotMapperService;

    /**
     * Complete workflow for friend response submission: validates self-evaluation,
     * builds and saves response session entity, updates calculations, and returns SubmitResponseResult.
     */
    @Transactional
    public SubmitResponseResult processFriendSubmission(String publicSlug,
                                                        String ownerToken,
                                                        String ipAddress,
                                                        FriendResponseInput request) {
        // 1. Fetch profile & guard self-evaluation
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        if (ownerToken != null && seenly.getOwnerTokenHash().equals(tokenHashingService.hashToken(ownerToken))) {
            throw new SelfEvaluationException("You cannot evaluate yourself.");
        }

        // 2. Build session and response entities
        ResponseSession session = ResponseSession.builder()
            .nickname(request.getNickname())
            .fingerprintHash(request.getFingerprintHash())
            .ipAddress(ipAddress)
            .friendTimeAnalytics(request.getFriendTimeAnalytics() != null ? request.getFriendTimeAnalytics() : new HashMap<>())
            .build();

        session.setResponses(request.getFriendResponses().stream().map(ans ->
            FriendResponse.builder()
                .responseSession(session)
                .questionId(ans.getQuestionId())
                .answerValue(ans.getAnswerValue())
                .build()
        ).collect(Collectors.toList()));

        // 3. Submit responses and calculate reader style
        String styleId = submitResponse(publicSlug, session);

        // 4. Fetch updated snapshot
        Seenly updatedSeenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        ResultSnapshotDto snapshotDto = snapshotMapperService.toDto(updatedSeenly.getResultSnapshot());

        double accuracy = readerGameService.calculatePerceptionAccuracy(session);

        return new SubmitResponseResult(styleId, 0, 1, accuracy, snapshotDto);
    }

    /**
     * Submits a friend response session, increments the response counter atomically,
     * triggers optimistic locking checks, and recalculates the result snapshot.
     * Returns the computed readerStyleId for this session.
     */
    @Transactional
    public String submitResponse(String publicSlug, ResponseSession requestSession) {
        // 1. Fetch Seenly profile
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        // 2. Strict limit validation
        int totalResponders = seenly.getResponseCount();
        int totalAllowedCapacity = Integer.MAX_VALUE;
        if (!seenly.getIsPremium()) {
            totalAllowedCapacity = seenly.getBaseFormCapacity() + seenly.getPurchasedExtraCapacity();
        }

        if (seenly.isCapped() || totalResponders >= totalAllowedCapacity) {
            if (!seenly.isCapped()) {
                seenly.setCapped(true);
                seenlyRepository.saveAndFlush(seenly);
            }
            throw new QuotaExceededException("This Seenly profile has reached its maximum response capacity quota.");
        }

        // 3. Link session to Seenly and save
        requestSession.setSeenly(seenly);
        sessionRepository.save(requestSession);

        // 4. Atomically increment and check if cap is reached
        int nextCount = seenly.getResponseCount() + 1;
        seenly.setResponseCount(nextCount);
        if (!seenly.getIsPremium() && nextCount >= totalAllowedCapacity) {
            seenly.setCapped(true);
        }

        // 5. Save seenly (this triggers the JPA @Version lock validation)
        seenlyRepository.saveAndFlush(seenly);

        // 6. Recalculate ResultSnapshot
        scoringEngineService.recalculateResultSnapshot(seenly);

        // 7. Calculate Reader Style
        return readerGameService.calculateReaderStyle(requestSession);
    }
}
