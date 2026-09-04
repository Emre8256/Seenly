package com.seenly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "response_sessions", indexes = {
    @Index(name = "idx_response_session_seenly_id", columnList = "seenly_id"),
    @Index(name = "idx_session_dup_guard", columnList = "seenly_id, ipAddress, fingerprintHash")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seenly_id", nullable = false)
    private Seenly seenly;

    @Column
    private String nickname; // Optional name chosen by the respondent

    @Column(nullable = false)
    private String fingerprintHash; // IP or browser fingerprint hash to guard against spam

    @Column
    private String ipAddress; // IP address of the respondent for spam protection

    @OneToMany(mappedBy = "responseSession", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FriendResponse> responses;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "response_session_time_analytics", joinColumns = @JoinColumn(name = "session_id"))
    @MapKeyColumn(name = "signal_key")
    @Column(name = "duration_ms")
    private java.util.Map<String, Integer> friendTimeAnalytics;

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;
}
