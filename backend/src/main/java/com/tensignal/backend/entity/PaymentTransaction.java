package com.tensignal.backend.entity;

import com.tensignal.backend.payment.EntitlementReversalStatus;
import com.tensignal.backend.payment.EntitlementType;
import com.tensignal.backend.payment.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions", uniqueConstraints = {
    @UniqueConstraint(name = "uk_payment_provider_transaction", columnNames = {"provider", "provider_transaction_id"}),
    @UniqueConstraint(name = "uk_payment_provider_checkout", columnNames = {"provider", "provider_checkout_id"})
}, indexes = {
    @Index(name = "idx_payment_owner_created", columnList = "owner_account_id,created_at"),
    @Index(name = "idx_payment_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {
    @Id
    private UUID id;

    @Column(name = "owner_account_id", nullable = false, updatable = false)
    private UUID ownerAccountId;

    @Column(name = "owner_profile_id", nullable = false, updatable = false)
    private UUID ownerProfileId;

    @Column(nullable = false, updatable = false, length = 80)
    private String productCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 32)
    private EntitlementType entitlementType;

    @Column(nullable = false, updatable = false)
    private int entitlementQuantity;

    @Column(nullable = false, updatable = false, length = 40)
    private String provider;

    @Column(name = "provider_transaction_id", length = 180)
    private String providerTransactionId;

    @Column(name = "provider_checkout_id", length = 180)
    private String providerCheckoutId;

    @Column(nullable = false, updatable = false)
    private long amountMinor;

    @Column(nullable = false, updatable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentStatus status;

    private Instant lastProviderEventAt;
    private Instant entitlementGrantedAt;
    private Instant refundedAt;
    private Instant chargebackAt;
    private Integer responseCountAtGrant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private EntitlementReversalStatus reversalStatus = EntitlementReversalStatus.NONE;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
