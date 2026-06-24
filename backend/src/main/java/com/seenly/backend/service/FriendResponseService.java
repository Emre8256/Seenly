package com.seenly.backend.service;

import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.ResponseSessionRepository;
import com.seenly.backend.exception.ResourceNotFoundException;
import com.seenly.backend.exception.FreeCapReachedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FriendResponseService {

    private final SeenlyRepository seenlyRepository;
    private final ResponseSessionRepository sessionRepository;
    private final ScoringEngineService scoringEngineService;
    private final ReaderGameService readerGameService;

    public FriendResponseService(SeenlyRepository seenlyRepository, 
                                 ResponseSessionRepository sessionRepository,
                                 ScoringEngineService scoringEngineService,
                                 ReaderGameService readerGameService) {
        this.seenlyRepository = seenlyRepository;
        this.sessionRepository = sessionRepository;
        this.scoringEngineService = scoringEngineService;
        this.readerGameService = readerGameService;
    }

    /**
     * Submits a friend response session, increments the response counter atomically,
     * triggers optimistic locking checks, recalculates the result snapshot, and awards XP.
     * Returns the computed readerStyleId for this session.
     */
    @Transactional
    public String submitResponse(String publicSlug, ResponseSession requestSession) {
        // 1. Fetch Seenly profile
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        // 2. Strict limit validation
        if (seenly.isCapped() || seenly.getResponseCount() >= 12) {
            throw new FreeCapReachedException("This Seenly has already reached its free response limit.");
        }

        // 3. Link session to Seenly and save
        requestSession.setSeenly(seenly);
        sessionRepository.save(requestSession);

        // 4. Atomically increment and check if cap is reached
        int nextCount = seenly.getResponseCount() + 1;
        seenly.setResponseCount(nextCount);
        if (nextCount >= 12) {
            seenly.setCapped(true);
        }

        // 5. Save seenly (this triggers the JPA @Version lock validation)
        seenlyRepository.saveAndFlush(seenly);

        // 6. Recalculate ResultSnapshot
        scoringEngineService.recalculateResultSnapshot(seenly);

        // 7. Calculate Reader Style and award XP if user profile is linked
        String readerStyleId = readerGameService.calculateReaderStyle(requestSession);
        if (requestSession.getReader() != null) {
            readerGameService.awardResponseXP(requestSession.getReader(), readerStyleId);
        }

        return readerStyleId;
    }
}
