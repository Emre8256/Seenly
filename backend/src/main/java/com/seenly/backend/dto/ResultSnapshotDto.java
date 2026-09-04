package com.seenly.backend.dto;

import com.seenly.backend.entity.ResultSnapshot;
import com.seenly.backend.service.SnapshotMapperService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultSnapshotDto {
    private String scoringVersion;
    private String selfSignatureId;
    private String selfFamilyId;
    
    // Privacy-guarded fields
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
    private List<ResponseSessionDto> responseSessions;

    /**
     * Backward-compatible constructor delegating to mapper.
     */
    public ResultSnapshotDto(ResultSnapshot snapshot) {
        if (snapshot == null) {
            throw new IllegalArgumentException("Snapshot cannot be null");
        }
        SnapshotMapperService mapper = new SnapshotMapperService();
        ResultSnapshotDto mapped = mapper.toDto(snapshot);
        this.scoringVersion = mapped.scoringVersion;
        this.selfSignatureId = mapped.selfSignatureId;
        this.selfFamilyId = mapped.selfFamilyId;
        this.outsideSignatureId = mapped.outsideSignatureId;
        this.outsideFamilyId = mapped.outsideFamilyId;
        this.gapPatternId = mapped.gapPatternId;
        this.gapStrength = mapped.gapStrength;
        this.confidenceBand = mapped.confidenceBand;
        this.responseCount = mapped.responseCount;
        this.totalProfileClicks = mapped.totalProfileClicks;
        this.totalResponders = mapped.totalResponders;
        this.publicSlug = mapped.publicSlug;
        this.displayName = mapped.displayName;
        this.email = mapped.email;
        this.avatar = mapped.avatar;
        this.isPremium = mapped.isPremium;
        this.currentResponseCount = mapped.currentResponseCount;
        this.maxResponseLimit = mapped.maxResponseLimit;
        this.lastNameChangedAt = mapped.lastNameChangedAt;
        this.nextAllowedNameChangeDate = mapped.nextAllowedNameChangeDate;
        this.nameChangeDaysRemaining = mapped.nameChangeDaysRemaining;
        this.selfAverages = mapped.selfAverages;
        this.friendAverages = mapped.friendAverages;
        this.friendTimeAnalytics = mapped.friendTimeAnalytics;
        this.responseSessions = mapped.responseSessions;
    }
}
