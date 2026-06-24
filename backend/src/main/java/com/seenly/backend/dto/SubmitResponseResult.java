package com.seenly.backend.dto;

public class SubmitResponseResult {
    private final String readerStyleId;
    private final int xpGained;
    private final int level;
    private final double accuracy;
    private final ResultSnapshotDto resultSnapshot;

    public SubmitResponseResult(String readerStyleId, int xpGained, int level, double accuracy, ResultSnapshotDto resultSnapshot) {
        this.readerStyleId = readerStyleId;
        this.xpGained = xpGained;
        this.level = level;
        this.accuracy = accuracy;
        this.resultSnapshot = resultSnapshot;
    }

    public String getReaderStyleId() {
        return readerStyleId;
    }

    public int getXpGained() {
        return xpGained;
    }

    public int getLevel() {
        return level;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public ResultSnapshotDto getResultSnapshot() {
        return resultSnapshot;
    }
}
