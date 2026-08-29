package com.seenly.backend.dto;

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

    public CardRarityDto() {}

    public CardRarityDto(String cardId, String tier, String trLabel, String enLabel,
                         String symbol, int topPercentile, String formattedBadgeTR,
                         String formattedBadgeEN, long totalSamples) {
        this.cardId = cardId;
        this.tier = tier;
        this.trLabel = trLabel;
        this.enLabel = enLabel;
        this.symbol = symbol;
        this.topPercentile = topPercentile;
        this.formattedBadgeTR = formattedBadgeTR;
        this.formattedBadgeEN = formattedBadgeEN;
        this.totalSamples = totalSamples;
    }

    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public String getTrLabel() { return trLabel; }
    public void setTrLabel(String trLabel) { this.trLabel = trLabel; }

    public String getEnLabel() { return enLabel; }
    public void setEnLabel(String enLabel) { this.enLabel = enLabel; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public int getTopPercentile() { return topPercentile; }
    public void setTopPercentile(int topPercentile) { this.topPercentile = topPercentile; }

    public String getFormattedBadgeTR() { return formattedBadgeTR; }
    public void setFormattedBadgeTR(String formattedBadgeTR) { this.formattedBadgeTR = formattedBadgeTR; }

    public String getFormattedBadgeEN() { return formattedBadgeEN; }
    public void setFormattedBadgeEN(String formattedBadgeEN) { this.formattedBadgeEN = formattedBadgeEN; }

    public long getTotalSamples() { return totalSamples; }
    public void setTotalSamples(long totalSamples) { this.totalSamples = totalSamples; }
}
