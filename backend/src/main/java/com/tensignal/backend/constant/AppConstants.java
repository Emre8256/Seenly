package com.tensignal.backend.constant;

import java.util.List;

public final class AppConstants {

    private AppConstants() {
        // Prevent instantiation
    }

    // 10 Social Perception Signal Keys (mapped to i18n copy)
    public static final List<String> LENSES = List.of(
        "samimiyet", "cekicilik", "zeka", "vizyon", "enerji",
        "guvenilirlik", "ego", "basari", "comertlik", "olgunluk"
    );

    // Business Rules & Capacities
    public static final int NAME_CHANGE_COOLDOWN_DAYS = 14;
    public static final int DEFAULT_BASE_CAPACITY = 20;
    public static final List<Integer> ALLOWED_PACK_AMOUNTS = List.of(50, 150, 300);
    public static final List<Integer> ALL_PACK_AMOUNTS = List.of(50, 100, 150, 250, 300, 500);

    // Response Count Thresholds for Perception Bands
    public static final int MIN_RESPONSES_FOR_OUTSIDE = 3;
    public static final int MIN_RESPONSES_FOR_STRONG_SIGNAL = 10;

    // Confidence Band Identifiers
    public static final String BAND_SELF_ONLY = "self_only";
    public static final String BAND_FORMING = "forming";
    public static final String BAND_OUTSIDE_OPEN = "outside_open";
    public static final String BAND_GAP_OPEN = "gap_open";
    public static final String BAND_STRONGER_SIGNAL = "stronger_signal";

    // Reader Perception Style Identifiers
    public static final String STYLE_TELEPATHIC = "telepathic_reader";
    public static final String STYLE_CLEAR = "clear_reader";
    public static final String STYLE_BALANCED = "balanced_reader";
    public static final String STYLE_CASUAL = "casual_explorer";
    public static final String STYLE_STRANGER = "social_stranger";

    // Scoring Defaults
    public static final String DEFAULT_SCORING_VERSION = "v1.0";
    public static final String DEFAULT_FALLBACK_CARD = "the_safe_haven";
    public static final String DEFAULT_FALLBACK_FAMILY = "grounded_presence";
    public static final String DEFAULT_FALLBACK_GAP = "warmer_outside";
}
