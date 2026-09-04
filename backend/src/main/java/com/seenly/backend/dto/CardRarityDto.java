package com.seenly.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardRarityDto {
    private String cardId;
    private String tier;                // YAYGIN, SECKIN, NADIR, ESSIZ
    private String trLabel;             // Yaygın, Seçkin, Nadir, Eşsiz
    private String enLabel;             // Common, Elite, Rare, Unique
    private String symbol;              // "", "•", "✦", "❖"
    private int topPercentile;          // e.g. 8 (Top 8%)
    private String formattedBadgeTR;    // e.g. "✦ Nadir %8"
    private String formattedBadgeEN;    // e.g. "✦ Rare 8%"
    private long totalSamples;
}
