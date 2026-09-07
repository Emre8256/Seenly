package com.seenly.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Complete dashboard representation available only after owner-token authorization.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerDashboardDto {
    private String scoringVersion;
    private String selfSignatureId;
    private String selfFamilyId;
    private String outsideSignatureId;
    private String outsideFamilyId;
    private String gapPatternId;
    private String gapStrength;
    private String confidenceBand;
    private int responseCount;
    private int totalProfileClicks;
    private int totalResponders;
    private String publicSlug;
    private String displayName;
    private String email;
    private String avatar;
    private Boolean isPremium;
    private Integer currentResponseCount;
    private Integer maxResponseLimit;
    private LocalDateTime lastNameChangedAt;
    private LocalDateTime nextAllowedNameChangeDate;
    private Long nameChangeDaysRemaining;
    private Map<String, Double> selfAverages;
    private Map<String, Double> friendAverages;
    private Map<String, Double> friendTimeAnalytics;
    /** Detailed history is intentionally served by the bounded owner history endpoint. */
    private List<ResponseSessionDto> responseSessions;
}
