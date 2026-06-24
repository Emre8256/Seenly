package com.seenly.backend.service;

import com.seenly.backend.entity.*;
import com.seenly.backend.repository.ReaderProfileRepository;
import com.seenly.backend.repository.ReaderXpTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Service
public class ReaderGameService {

    private final ReaderProfileRepository profileRepository;
    private final ReaderXpTransactionRepository xpTransactionRepository;
    private final ScoringEngineService scoringEngineService;

    public ReaderGameService(ReaderProfileRepository profileRepository, 
                             ReaderXpTransactionRepository xpTransactionRepository,
                             ScoringEngineService scoringEngineService) {
        this.profileRepository = profileRepository;
        this.xpTransactionRepository = xpTransactionRepository;
        this.scoringEngineService = scoringEngineService;
    }

    /**
     * Awards 15 XP to the reader, updates their level, increments solvedCount,
     * and logs the transaction.
     */
    @Transactional
    public void awardResponseXP(User reader, String readerStyleId) {
        if (reader == null) return;

        ReaderProfile profile = reader.getReaderProfile();
        if (profile == null) {
            profile = ReaderProfile.builder()
                .user(reader)
                .xp(0)
                .level(1)
                .solvedCount(0)
                .build();
        }

        // Add 15 XP
        int newXp = profile.getXp() + 15;
        profile.setXp(newXp);
        profile.setSolvedCount(profile.getSolvedCount() + 1);
        profile.setLevel(calculateLevelFromXp(newXp));
        profile.setReaderStyleId(readerStyleId);

        profileRepository.save(profile);

        // Log transaction
        ReaderXpTransaction transaction = ReaderXpTransaction.builder()
            .readerProfile(profile)
            .actionType("completed_friend_quiz")
            .xpAmount(15)
            .build();
        xpTransactionRepository.save(transaction);
    }

    /**
     * Determines the level of a reader based on their cumulative XP.
     */
    public int calculateLevelFromXp(int xp) {
        if (xp >= 1200) return 6;
        if (xp >= 700) return 5;
        if (xp >= 350) return 4;
        if (xp >= 150) return 3;
        if (xp >= 50) return 2;
        return 1;
    }

    /**
     * Calculates the perception accuracy score between the friend's answers
     * and the owner's self answers.
     */
    public double calculatePerceptionAccuracy(ResponseSession session) {
        if (session == null || session.getResponses() == null || session.getResponses().isEmpty()) {
            return 0.0;
        }
        Seenly seenly = session.getSeenly();
        if (seenly == null || seenly.getSelfAnswers() == null || seenly.getSelfAnswers().isEmpty()) {
            return 0.0;
        }

        // Map self answers by lens name
        Map<String, Integer> selfVals = new HashMap<>();
        for (SelfAnswer sa : seenly.getSelfAnswers()) {
            String lens = scoringEngineService.extractLensFromQuestionId(sa.getQuestionId());
            selfVals.put(lens, sa.getAnswerValue());
        }

        double totalDiff = 0.0;
        int count = 0;
        for (FriendResponse fr : session.getResponses()) {
            String lens = scoringEngineService.extractLensFromQuestionId(fr.getQuestionId());
            Integer selfVal = selfVals.get(lens);
            if (selfVal != null) {
                totalDiff += Math.abs(fr.getAnswerValue() - selfVal);
                count++;
            }
        }

        if (count == 0) return 0.0;

        // Max difference per question is 4 (since answers are 1-5).
        // Max total difference is count * 4.
        double maxDiff = count * 4.0;
        return 100.0 * (1.0 - (totalDiff / maxDiff));
    }

    /**
     * Computes the Reader Style based on answering biases within a session.
     */
    public String calculateReaderStyle(ResponseSession session) {
        double accuracy = calculatePerceptionAccuracy(session);
        if (accuracy >= 90.0) {
            return "telepathic_reader";
        } else if (accuracy >= 75.0) {
            return "clear_reader";
        } else if (accuracy >= 55.0) {
            return "balanced_reader";
        } else if (accuracy >= 35.0) {
            return "casual_explorer";
        } else {
            return "social_stranger";
        }
    }
}
