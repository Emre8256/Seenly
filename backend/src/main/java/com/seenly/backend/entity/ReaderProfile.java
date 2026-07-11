package com.seenly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reader_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReaderProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "readerProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<ReaderXpTransaction> xpTransactions;

    @Column(nullable = false)
    private int xp = 0;

    @Column(nullable = false)
    private int level = 1;

    @Column
    private String readerStyleId; // Semantic ID, e.g., "signal_spotter"

    @Column(nullable = false)
    private int solvedCount = 0;

    // Privacy toggles
    @Column(nullable = false)
    private boolean showReaderStyle = true;

    @Column(nullable = false)
    private boolean showReaderLevel = true;

    @Column(nullable = false)
    private boolean showSolvedCount = true;

    @Column(nullable = false)
    private boolean showTopLenses = true;

    @Column(nullable = false)
    private boolean hideSolvedProfiles = true;

    @Column(nullable = false)
    private boolean hideCalibration = true;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
