package com.seenly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "response_sessions")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reader_id", nullable = true)
    private User reader; // Linked to friend's User if they have a saved reader profile

    @Column
    private String nickname; // Optional name chosen by the respondent

    @Column(nullable = false)
    private String fingerprintHash; // IP or browser fingerprint hash to guard against spam

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
