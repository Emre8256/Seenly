package com.seenly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "friend_responses", indexes = {
    @Index(name = "idx_friend_response_session_id", columnList = "response_session_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendResponse {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "response_session_id", nullable = false)
    private ResponseSession responseSession;

    @Column(nullable = false)
    private String questionId; // Semantic ID, e.g., "classic_friend_warmth_01"

    @Column(nullable = false)
    private int answerValue; // 1 to 5

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;
}
