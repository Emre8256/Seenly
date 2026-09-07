package com.seenly.backend.entity;

import com.seenly.backend.payment.PaymentEventOutcome;
import com.seenly.backend.payment.PaymentEventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_provider_events", uniqueConstraints = {
    @UniqueConstraint(name = "uk_payment_provider_event", columnNames = {"provider", "provider_event_id"})
}, indexes = {
    @Index(name = "idx_payment_event_transaction", columnList = "payment_transaction_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentProviderEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false, length = 40)
    private String provider;

    @Column(name = "provider_event_id", nullable = false, updatable = false, length = 180)
    private String providerEventId;

    @Column(name = "payment_transaction_id", nullable = false, updatable = false)
    private UUID paymentTransactionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 40)
    private PaymentEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 32)
    private PaymentEventOutcome outcome;

    @Column(nullable = false, updatable = false, length = 64)
    private String payloadDigest;

    @Column(nullable = false, updatable = false)
    private Instant providerOccurredAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant processedAt;
}
