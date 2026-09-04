package com.seenly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "self_answers", indexes = {
    @Index(name = "idx_self_answer_seenly_id", columnList = "seenly_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SelfAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seenly_id", nullable = false)
    private Seenly seenly;

    @Column(nullable = false)
    private String questionId; // Semantic ID, e.g., "classic_self_warmth_01"

    @Column(nullable = false)
    private int answerValue; // 1 to 5

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;
}
