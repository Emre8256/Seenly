package com.seenly.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * Deliberately minimal representation of a Seenly profile safe for public links.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicProfileDto {
    private String publicSlug;
    private String displayName;
    private String avatar;
    private int responseCount;
    private boolean acceptingResponses;
    private String outsideSignatureId;
    private String outsideFamilyId;
    private String confidenceBand;
    private Map<String, Double> friendAverages;
}
