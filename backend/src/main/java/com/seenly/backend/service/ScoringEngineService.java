package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.entity.SelfAnswer;
import com.seenly.backend.entity.FriendResponse;
import com.seenly.backend.entity.ResultSnapshot;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.ResponseSession;
import com.seenly.backend.repository.ResultSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringEngineService {

    private final ResultSnapshotRepository snapshotRepository;
    private final CardRarityService cardRarityService;

    /**
     * Normalizes a 1-5 answer to a 0.0-1.0 range.
     */
    public double normalizeAnswer(int answerValue) {
        return (answerValue - 1) / 4.0;
    }

    /**
     * Helper to extract the lens name from a semantic question ID (e.g. classic_self_zeka_01 -> zeka).
     */
    public String extractLensFromQuestionId(String questionId) {
        if (questionId == null) return "samimiyet";
        String lower = questionId.toLowerCase();
        for (String lens : AppConstants.LENSES) {
            if (lower.contains(lens)) {
                return lens;
            }
        }
        String[] parts = questionId.split("_");
        if (parts.length >= 3) {
            return parts[2].toLowerCase();
        }
        return parts[0].toLowerCase();
    }

    /**
     * Calculates the owner's self-evaluation results (Self Profile).
     */
    @Transactional
    public ResultSnapshot calculateSelfResult(Seenly seenly) {
        List<SelfAnswer> answers = seenly.getSelfAnswers();
        Map<String, Double> selfLenses = calculateLensAverages(answers);

        String familyId = determineSocialFamily(selfLenses);
        String signatureId = determineSocialSignature(selfLenses, familyId);

        ResultSnapshot snapshot = seenly.getResultSnapshot();
        if (snapshot == null) {
            snapshot = ResultSnapshot.builder().seenly(seenly).build();
        }

        snapshot.setSelfSignatureId(signatureId);
        snapshot.setSelfFamilyId(familyId);
        snapshot.setConfidenceBand(AppConstants.BAND_SELF_ONLY);

        if (cardRarityService != null && signatureId != null) {
            cardRarityService.recordCardGeneration(signatureId);
        }

        return snapshotRepository.save(snapshot);
    }

    /**
     * Recalculates the Outside profile and The Gap metrics when new friend responses arrive.
     */
    @Transactional
    public void recalculateResultSnapshot(Seenly seenly) {
        ResultSnapshot snapshot = seenly.getResultSnapshot();
        if (snapshot == null) {
            snapshot = calculateSelfResult(seenly);
        }

        int responseCount = seenly.getResponseCount();
        if (responseCount < AppConstants.MIN_RESPONSES_FOR_OUTSIDE) {
            snapshot.setConfidenceBand(AppConstants.BAND_FORMING);
            snapshotRepository.save(snapshot);
            return;
        }

        // Aggregate friend answers
        List<FriendResponse> allFriendResponses = new ArrayList<>();
        if (seenly.getResponseSessions() != null) {
            for (ResponseSession session : seenly.getResponseSessions()) {
                if (session.getResponses() != null) {
                    allFriendResponses.addAll(session.getResponses());
                }
            }
        }

        Map<String, Double> outsideLenses = calculateFriendLensAverages(allFriendResponses);
        String outsideFamilyId = determineSocialFamily(outsideLenses);
        String outsideSignatureId = determineSocialSignature(outsideLenses, outsideFamilyId);

        snapshot.setOutsideSignatureId(outsideSignatureId);
        snapshot.setOutsideFamilyId(outsideFamilyId);

        if (cardRarityService != null && outsideSignatureId != null) {
            cardRarityService.recordCardGeneration(outsideSignatureId);
        }

        if (responseCount >= AppConstants.MIN_RESPONSES_FOR_OUTSIDE) {
            snapshot.setConfidenceBand(AppConstants.BAND_GAP_OPEN);
            // Compute Gap Patterns
            Map<String, Double> selfLenses = calculateLensAverages(seenly.getSelfAnswers());
            Map<String, Double> deltas = calculateDeltas(selfLenses, outsideLenses);
            String gapPatternId = determineGapPattern(deltas);
            String gapStrength = determineGapStrength(deltas);

            snapshot.setGapPatternId(gapPatternId);
            snapshot.setGapStrength(gapStrength);
        } else {
            snapshot.setConfidenceBand(AppConstants.BAND_OUTSIDE_OPEN);
        }

        if (responseCount >= AppConstants.MIN_RESPONSES_FOR_STRONG_SIGNAL) {
            snapshot.setConfidenceBand(AppConstants.BAND_STRONGER_SIGNAL);
        }

        snapshot.setUpdatedAt(java.time.LocalDateTime.now());
        snapshotRepository.save(snapshot);
    }

    private Map<String, Double> calculateLensAverages(List<SelfAnswer> answers) {
        Map<String, List<Double>> lensValues = new HashMap<>();
        for (String lens : AppConstants.LENSES) {
            lensValues.put(lens, new ArrayList<>());
        }

        for (SelfAnswer answer : answers) {
            String lens = extractLensFromQuestionId(answer.getQuestionId());
            if (lensValues.containsKey(lens)) {
                lensValues.get(lens).add(normalizeAnswer(answer.getAnswerValue()));
            }
        }

        Map<String, Double> averages = new HashMap<>();
        for (String lens : AppConstants.LENSES) {
            List<Double> vals = lensValues.get(lens);
            if (vals.isEmpty()) {
                averages.put(lens, 0.5); // neutral fallback
            } else {
                double sum = 0.0;
                for (double v : vals) sum += v;
                averages.put(lens, sum / vals.size());
            }
        }
        return averages;
    }

    private Map<String, Double> calculateFriendLensAverages(List<FriendResponse> answers) {
        Map<String, List<Double>> lensValues = new HashMap<>();
        for (String lens : AppConstants.LENSES) {
            lensValues.put(lens, new ArrayList<>());
        }

        for (FriendResponse answer : answers) {
            String lens = extractLensFromQuestionId(answer.getQuestionId());
            if (lensValues.containsKey(lens)) {
                lensValues.get(lens).add(normalizeAnswer(answer.getAnswerValue()));
            }
        }

        Map<String, Double> averages = new HashMap<>();
        for (String lens : AppConstants.LENSES) {
            List<Double> vals = lensValues.get(lens);
            if (vals.isEmpty()) {
                averages.put(lens, 0.5); // neutral fallback
            } else {
                double sum = 0.0;
                for (double v : vals) sum += v;
                averages.put(lens, sum / vals.size());
            }
        }
        return averages;
    }

    public String determineSocialFamily(Map<String, Double> lensScores) {
        double groundedPresence = (getOrZero(lensScores, "olgunluk") + getOrZero(lensScores, "guvenilirlik") + getOrZero(lensScores, "samimiyet")) / 3.0;
        double warmAccess = (getOrZero(lensScores, "samimiyet") + getOrZero(lensScores, "comertlik") + getOrZero(lensScores, "enerji")) / 3.0;
        double hiddenDepth = (getOrZero(lensScores, "zeka") + getOrZero(lensScores, "vizyon") + getOrZero(lensScores, "olgunluk")) / 3.0;
        double clearEnergy = (getOrZero(lensScores, "cekicilik") + getOrZero(lensScores, "basari") + getOrZero(lensScores, "ego") + getOrZero(lensScores, "enerji")) / 4.0;

        Map<String, Double> familyScores = new LinkedHashMap<>();
        familyScores.put("grounded_presence", groundedPresence);
        familyScores.put("warm_access", warmAccess);
        familyScores.put("hidden_depth", hiddenDepth);
        familyScores.put("clear_energy", clearEnergy);

        return familyScores.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(AppConstants.DEFAULT_FALLBACK_FAMILY);
    }

    public String determineSocialSignature(Map<String, Double> lensScores, String familyId) {
        Map<String, List<String>> cardSignals = new LinkedHashMap<>();
        cardSignals.put("the_leader", Arrays.asList("basari", "olgunluk"));
        cardSignals.put("the_visionary", Arrays.asList("vizyon", "zeka"));
        cardSignals.put("the_magnet", Arrays.asList("cekicilik", "enerji"));
        cardSignals.put("the_safe_haven", Arrays.asList("guvenilirlik", "samimiyet"));
        cardSignals.put("the_social_star", Arrays.asList("samimiyet", "enerji"));
        cardSignals.put("the_elite_mind", Arrays.asList("vizyon", "ego"));
        cardSignals.put("the_noble_heart", Arrays.asList("comertlik", "samimiyet"));
        cardSignals.put("the_silent_king", Arrays.asList("olgunluk", "zeka"));
        cardSignals.put("the_alpha_achiever", Arrays.asList("basari", "ego"));
        cardSignals.put("the_benevolent_guide", Arrays.asList("comertlik", "olgunluk"));
        cardSignals.put("the_ice_queen_king", Arrays.asList("cekicilik", "ego"));
        cardSignals.put("the_mastermind", Arrays.asList("zeka", "enerji"));
        cardSignals.put("the_playmaker", Arrays.asList("vizyon", "basari"));
        cardSignals.put("the_sweetheart", Arrays.asList("samimiyet", "cekicilik"));
        cardSignals.put("the_empath", Arrays.asList("samimiyet", "zeka"));
        cardSignals.put("the_dreamer", Arrays.asList("samimiyet", "vizyon"));
        cardSignals.put("the_proud_friend", Arrays.asList("samimiyet", "ego"));
        cardSignals.put("the_ambitious_sweetheart", Arrays.asList("samimiyet", "basari"));
        cardSignals.put("the_calm_harbor", Arrays.asList("samimiyet", "olgunluk"));
        cardSignals.put("the_seductive_mind", Arrays.asList("cekicilik", "zeka"));
        cardSignals.put("the_aesthetic", Arrays.asList("cekicilik", "vizyon"));
        cardSignals.put("the_charming_anchor", Arrays.asList("cekicilik", "guvenilirlik"));
        cardSignals.put("the_star_player", Arrays.asList("cekicilik", "basari"));
        cardSignals.put("the_party_host", Arrays.asList("cekicilik", "comertlik"));
        cardSignals.put("the_mature_charm", Arrays.asList("cekicilik", "olgunluk"));
        cardSignals.put("the_consultant", Arrays.asList("zeka", "guvenilirlik"));
        cardSignals.put("the_know_it_all", Arrays.asList("zeka", "ego"));
        cardSignals.put("the_strategist", Arrays.asList("zeka", "basari"));
        cardSignals.put("the_intellectual_giver", Arrays.asList("zeka", "comertlik"));
        cardSignals.put("the_innovator", Arrays.asList("vizyon", "enerji"));
        cardSignals.put("the_idealist", Arrays.asList("vizyon", "guvenilirlik"));
        cardSignals.put("the_philanthropist", Arrays.asList("vizyon", "comertlik"));
        cardSignals.put("the_philosopher", Arrays.asList("vizyon", "olgunluk"));
        cardSignals.put("the_golden_retriever", Arrays.asList("enerji", "guvenilirlik"));
        cardSignals.put("the_showman", Arrays.asList("enerji", "ego"));
        cardSignals.put("the_powerhouse", Arrays.asList("enerji", "basari"));
        cardSignals.put("the_life_giver", Arrays.asList("enerji", "comertlik"));
        cardSignals.put("the_steady_vibe", Arrays.asList("enerji", "olgunluk"));
        cardSignals.put("the_gatekeeper", Arrays.asList("guvenilirlik", "ego"));
        cardSignals.put("the_pillar", Arrays.asList("guvenilirlik", "basari"));
        cardSignals.put("the_helper", Arrays.asList("guvenilirlik", "comertlik"));
        cardSignals.put("the_protector", Arrays.asList("guvenilirlik", "olgunluk"));
        cardSignals.put("the_proud_patron", Arrays.asList("ego", "comertlik"));
        cardSignals.put("the_stoic_king", Arrays.asList("ego", "olgunluk"));
        cardSignals.put("the_patron", Arrays.asList("basari", "comertlik"));

        String bestCard = null;
        double maxScore = -1.0;

        for (Map.Entry<String, List<String>> entry : cardSignals.entrySet()) {
            String cardId = entry.getKey();
            List<String> signals = entry.getValue();
            
            // Get percentage scores (0.0 to 100.0)
            double p1 = lensScores.getOrDefault(signals.get(0), 0.5) * 100.0;
            double p2 = lensScores.getOrDefault(signals.get(1), 0.5) * 100.0;
            
            double score = p1 * p2;
            
            if (score > maxScore + 0.00001) {
                maxScore = score;
                bestCard = cardId;
            }
        }

        return bestCard != null ? bestCard : AppConstants.DEFAULT_FALLBACK_CARD;
    }

    private Map<String, Double> calculateDeltas(Map<String, Double> self, Map<String, Double> outside) {
        Map<String, Double> deltas = new HashMap<>();
        for (String lens : AppConstants.LENSES) {
            deltas.put(lens, outside.getOrDefault(lens, 0.5) - self.getOrDefault(lens, 0.5));
        }
        return deltas;
    }

    public String determineGapPattern(Map<String, Double> deltas) {
        Map<String, Double> patterns = new LinkedHashMap<>();
        patterns.put("warmer_outside", deltas.getOrDefault("samimiyet", 0.0));
        patterns.put("louder_outside", deltas.getOrDefault("cekicilik", 0.0) + deltas.getOrDefault("enerji", 0.0));
        patterns.put("softer_outside", deltas.getOrDefault("samimiyet", 0.0) - deltas.getOrDefault("ego", 0.0));
        patterns.put("more_reserved_outside", deltas.getOrDefault("ego", 0.0) + deltas.getOrDefault("olgunluk", 0.0));
        patterns.put("clearer_outside", deltas.getOrDefault("guvenilirlik", 0.0));
        patterns.put("hidden_depth", deltas.getOrDefault("zeka", 0.0) + deltas.getOrDefault("vizyon", 0.0));
        patterns.put("more_grounded", deltas.getOrDefault("olgunluk", 0.0) + deltas.getOrDefault("guvenilirlik", 0.0));
        patterns.put("softer_landing", deltas.getOrDefault("comertlik", 0.0) + deltas.getOrDefault("samimiyet", 0.0));
        patterns.put("more_driven", deltas.getOrDefault("basari", 0.0) + deltas.getOrDefault("vizyon", 0.0));
        patterns.put("quieter_presence", -1.0 * (deltas.getOrDefault("enerji", 0.0) + deltas.getOrDefault("cekicilik", 0.0)));

        return patterns.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(AppConstants.DEFAULT_FALLBACK_GAP);
    }

    public String determineGapStrength(Map<String, Double> deltas) {
        double maxDelta = deltas.values().stream()
            .mapToDouble(Math::abs)
            .max()
            .orElse(0.0);

        if (maxDelta > 0.40) {
            return "strong";
        } else if (maxDelta > 0.20) {
            return "clear";
        } else {
            return "subtle";
        }
    }

    private double getOrZero(Map<String, Double> map, String key) {
        return map.getOrDefault(key, 0.5);
    }
}
