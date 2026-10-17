package com.tensignal.backend.service;

import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.entity.FriendResponse;
import com.tensignal.backend.entity.ResponseSession;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.SelfAnswer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReaderGameService {

    private final ScoringEngineService scoringEngineService;

    /**
     * Calculates the perception accuracy score between the friend's answers
     * and the owner's self answers.
     */
    public double calculatePerceptionAccuracy(ResponseSession session) {
        if (session == null || session.getResponses() == null || session.getResponses().isEmpty()) {
            return 0.0;
        }
        TenSignal tenSignal = session.getSeenly();
        if (tenSignal == null || tenSignal.getSelfAnswers() == null || tenSignal.getSelfAnswers().isEmpty()) {
            return 0.0;
        }

        // Map self answers by lens name
        Map<String, Integer> selfVals = new HashMap<>();
        for (SelfAnswer sa : tenSignal.getSelfAnswers()) {
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
            return AppConstants.STYLE_TELEPATHIC;
        } else if (accuracy >= 75.0) {
            return AppConstants.STYLE_CLEAR;
        } else if (accuracy >= 55.0) {
            return AppConstants.STYLE_BALANCED;
        } else if (accuracy >= 35.0) {
            return AppConstants.STYLE_CASUAL;
        } else {
            return AppConstants.STYLE_STRANGER;
        }
    }
}
