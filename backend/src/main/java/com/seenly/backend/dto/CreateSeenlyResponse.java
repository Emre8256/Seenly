package com.seenly.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class CreateSeenlyResponse {
    private String ownerToken; // Plain-text single-use token
    private String publicSlug;
    private OwnerDashboardDto resultSnapshot;
}
