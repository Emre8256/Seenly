package com.seenly.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seenly.backend.dto.CardRarityDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class CardRarityService {

    private static final Logger log = LoggerFactory.getLogger(CardRarityService.class);

    // Total platform generation counter
    private final AtomicLong totalPlatformGenerations = new AtomicLong(0);

    // Empirical generation counters per card ID
    private final Map<String, AtomicLong> empiricalCounts = new ConcurrentHashMap<>();

    // Theoretical prior matrix loaded from card_priors.json
    private final Map<String, CardPrior> priorMatrix = new ConcurrentHashMap<>();
    private double totalAlphaSum = 0.0;

    // Phase transition thresholds
    private static final long PHASE_1_PURE_PRIOR_MAX = 100;
    private static final long PHASE_2_HYBRID_MAX = 1000;

    public record CardPrior(
            String cardId,
            String trName,
            String enName,
            int priorPercentile,
            String defaultTier,
            double alphaWeight
    ) {}

    @PostConstruct
    public void init() {
        loadPriorsFromConfig();
    }

    private void loadPriorsFromConfig() {
        try {
            ClassPathResource resource = new ClassPathResource("card_priors.json");
            if (resource.exists()) {
                ObjectMapper mapper = new ObjectMapper();
                try (InputStream is = resource.getInputStream()) {
                    JsonNode root = mapper.readTree(is);
                    JsonNode archetypes = root.get("archetypes");
                    if (archetypes != null && archetypes.isObject()) {
                        double sum = 0.0;
                        var fields = archetypes.fields();
                        while (fields.hasNext()) {
                            var entry = fields.next();
                            String cardId = entry.getKey();
                            JsonNode node = entry.getValue();
                            double alpha = node.has("alphaWeight") ? node.get("alphaWeight").asDouble() : 50.0;
                            int percentile = node.has("priorPercentile") ? node.get("priorPercentile").asInt() : 50;
                            String defaultTier = node.has("defaultTier") ? node.get("defaultTier").asText() : "YAYGIN";
                            String trName = node.has("trName") ? node.get("trName").asText() : cardId;
                            String enName = node.has("enName") ? node.get("enName").asText() : cardId;

                            priorMatrix.put(cardId, new CardPrior(cardId, trName, enName, percentile, defaultTier, alpha));
                            sum += alpha;
                        }
                        this.totalAlphaSum = sum > 0 ? sum : 1.0;
                        log.info("Initialized Card Rarity Prior Matrix with {} archetypes (Total alpha sum: {})", 
                                 priorMatrix.size(), totalAlphaSum);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to load card_priors.json, initializing hardcoded defaults: {}", e.getMessage());
            initFallbackPriors();
        }
    }

    private void initFallbackPriors() {
        // Fallback safety matrix
        priorMatrix.put("the_elite_mind", new CardPrior("the_elite_mind", "Seçkin Akıl", "The Elite Mind", 3, "ESSIZ", 15));
        priorMatrix.put("the_stoic_king", new CardPrior("the_stoic_king", "Stoik Hükümdar", "The Stoic King", 3, "ESSIZ", 15));
        priorMatrix.put("the_visionary", new CardPrior("the_visionary", "Vizyoner", "The Visionary", 7, "NADIR", 35));
        priorMatrix.put("the_idealist", new CardPrior("the_idealist", "İdealist", "The Idealist", 8, "NADIR", 40));
        priorMatrix.put("the_magnet", new CardPrior("the_magnet", "Çekim Gücü", "The Magnet", 18, "SECKIN", 90));
        priorMatrix.put("the_empath", new CardPrior("the_empath", "Empat", "The Empath", 48, "YAYGIN", 240));
        this.totalAlphaSum = 430.0;
    }

    /**
     * Records a card generation event from a completed quiz or survey.
     */
    public void recordCardGeneration(String cardId) {
        if (cardId == null || cardId.isBlank()) return;
        totalPlatformGenerations.incrementAndGet();
        empiricalCounts.computeIfAbsent(cardId, k -> new AtomicLong(0)).incrementAndGet();
    }

    /**
     * Calculates the Bayesian-smoothed posterior probability and top percentile for a card.
     */
    public CardRarityDto getCardRarity(String cardId, String langCode) {
        long N = totalPlatformGenerations.get();
        CardPrior prior = priorMatrix.get(cardId);

        // Edge Case: If card is completely unknown, handle dynamic onboarding
        if (prior == null) {
            prior = handleDynamicCardOnboarding(cardId);
        }

        double smoothedRatio;
        int topPercentile;

        if (N < PHASE_1_PURE_PRIOR_MAX) {
            // PHASE 1: Pure Prior Phase (N < 100)
            topPercentile = prior.priorPercentile();
        } else if (N < PHASE_2_HYBRID_MAX) {
            // PHASE 2: Hybrid Bayesian Dirichlet Phase (100 <= N < 1000)
            long C_i = empiricalCounts.getOrDefault(cardId, new AtomicLong(0)).get();
            double alpha_i = prior.alphaWeight();
            smoothedRatio = (C_i + alpha_i) / (N + totalAlphaSum);
            topPercentile = Math.max(1, Math.min(99, (int) Math.round(smoothedRatio * 100.0)));
        } else {
            // PHASE 3: Fully Empirical Phase with Bayesian Safety Floor (N >= 1000)
            long C_i = empiricalCounts.getOrDefault(cardId, new AtomicLong(0)).get();
            double epsilon = 1000.0 / (double) N; // decay factor
            double alpha_i = prior.alphaWeight() * epsilon;
            double alphaSum = totalAlphaSum * epsilon;
            smoothedRatio = (C_i + alpha_i) / (N + alphaSum);
            topPercentile = Math.max(1, Math.min(99, (int) Math.round(smoothedRatio * 100.0)));
        }

        return buildCardRarityDto(cardId, topPercentile, N, langCode);
    }

    public Map<String, CardRarityDto> getAllCardRarities(String langCode) {
        Map<String, CardRarityDto> result = new HashMap<>();
        for (String cardId : priorMatrix.keySet()) {
            result.put(cardId, getCardRarity(cardId, langCode));
        }
        return result;
    }

    /**
     * Handles newly introduced archetypes post-launch (N > 10,000) without distortion.
     */
    private CardPrior handleDynamicCardOnboarding(String cardId) {
        log.warn("Onboarding dynamic unindexed card ID: {}", cardId);
        int defaultPercentile = 48;
        String defaultTier = "YAYGIN";
        double alphaWeight = 200.0;

        CardPrior newPrior = new CardPrior(cardId, cardId, cardId, defaultPercentile, defaultTier, alphaWeight);
        priorMatrix.put(cardId, newPrior);
        this.totalAlphaSum += alphaWeight;
        return newPrior;
    }

    private CardRarityDto buildCardRarityDto(String cardId, int topPercentile, long totalSamples, String langCode) {
        double rarityScore = 100.0 - topPercentile;
        String tier;
        String trLabel;
        String enLabel;
        String symbol;

        if (rarityScore >= 96.0) {
            tier = "ESSIZ";
            trLabel = "Eşsiz";
            enLabel = "Unique";
            symbol = "";
        } else if (rarityScore >= 85.0) {
            tier = "NADIR";
            trLabel = "Nadir";
            enLabel = "Rare";
            symbol = "";
        } else if (rarityScore >= 60.0) {
            tier = "SECKIN";
            trLabel = "Seçkin";
            enLabel = "Elite";
            symbol = "";
        } else {
            tier = "YAYGIN";
            trLabel = "Yaygın";
            enLabel = "Common";
            symbol = "";
        }

        String formattedTR = trLabel;
        String formattedEN = enLabel;

        return new CardRarityDto(
                cardId,
                tier,
                trLabel,
                enLabel,
                symbol,
                topPercentile,
                formattedTR,
                formattedEN,
                totalSamples
        );
    }
}
