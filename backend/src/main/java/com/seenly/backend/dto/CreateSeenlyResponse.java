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
public class CreateSeenlyResponse {
    private String ownerToken; // Plain-text single-use token
    private String publicSlug;
    private ResultSnapshotDto resultSnapshot;
}
