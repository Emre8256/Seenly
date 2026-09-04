package com.seenly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "result_snapshots", indexes = {
    @Index(name = "idx_result_snapshot_seenly_id", columnList = "seenly_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seenly_id", nullable = false)
    private Seenly seenly;

    @Builder.Default
    @Column(nullable = false)
    private String scoringVersion = "v1.0";

    // Semantic IDs (mapped to front-end i18n copy)
    @Column(nullable = false)
    private String selfSignatureId;

    @Column(nullable = false)
    private String selfFamilyId;

    // Nullable if responseCount < 3
    @Column
    private String outsideSignatureId;

    @Column
    private String outsideFamilyId;

    // Nullable if responseCount < 3
    @Column
    private String gapPatternId;

    @Column
    private String gapStrength; // "subtle" | "clear" | "strong"

    @Builder.Default
    @Column(nullable = false)
    private String confidenceBand = "self_only"; // "self_only" | "forming" | "outside_open" | "gap_open" | "stronger_signal"

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.scoringVersion == null) {
            this.scoringVersion = "v1.0";
        }
    }
}
