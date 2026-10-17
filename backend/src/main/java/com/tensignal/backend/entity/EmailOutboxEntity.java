package com.tensignal.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_outbox", indexes = {
    @Index(name = "idx_email_outbox_claim", columnList = "status, nextAttemptAt"),
    @Index(name = "idx_email_outbox_scheduled", columnList = "scheduledAt"),
    @Index(name = "idx_email_outbox_recipient_hash", columnList = "recipientHash"),
    @Index(name = "idx_email_outbox_expires", columnList = "expiresAt"),
    @Index(name = "idx_email_outbox_user_id", columnList = "userId"),
    @Index(name = "uk_email_outbox_idempotency_key", columnList = "idempotencyKey", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailOutboxEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column
    private UUID userId;

    @Column(nullable = false, length = 64)
    private String notificationType;

    @Column(nullable = false)
    private String recipient;

    @Column(nullable = false, length = 64)
    private String recipientHash;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String locale = "tr";

    @Column(nullable = false, columnDefinition = "text")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 32)
    private EmailOutboxStatus status = EmailOutboxStatus.PENDING;

    @Column(nullable = false)
    private Instant scheduledAt;

    @Column(nullable = false)
    private Instant nextAttemptAt;

    @Builder.Default
    @Column(nullable = false)
    private int attempts = 0;

    @Builder.Default
    @Column(nullable = false)
    private int maxAttempts = 5;

    @Column
    private Instant expiresAt;

    @Column
    private Instant sentAt;

    @Column
    private String providerMessageId;

    @Column(nullable = false, unique = true)
    private String idempotencyKey;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
