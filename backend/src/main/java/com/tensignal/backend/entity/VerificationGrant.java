package com.tensignal.backend.entity;

import com.tensignal.backend.constant.OtpPurpose;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "verification_grants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationGrant {
    @Id
    @Column(length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private OtpPurpose purpose;

    private UUID ownerProfileId;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant consumedAt;

    @Version
    private Long version;
}
