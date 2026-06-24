package com.seenly.backend.dto;

public class CreateSeenlyResponse {
    private final String ownerToken; // Plain-text single-use token
    private final String publicSlug;
    private final ResultSnapshotDto resultSnapshot;

    public CreateSeenlyResponse(String ownerToken, String publicSlug, ResultSnapshotDto resultSnapshot) {
        this.ownerToken = ownerToken;
        this.publicSlug = publicSlug;
        this.resultSnapshot = resultSnapshot;
    }

    public String getOwnerToken() {
        return ownerToken;
    }

    public String getPublicSlug() {
        return publicSlug;
    }

    public ResultSnapshotDto getResultSnapshot() {
        return resultSnapshot;
    }
}
