package com.seenly.backend.entity;

import com.seenly.backend.constant.OtpPurpose;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "otp_challenges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpChallenge {
    @Id
    @Column(length = 180)
    private String challengeKey;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private OtpPurpose purpose;

    private UUID ownerProfileId;

    @Column(nullable = false, length = 256)
    private String codeHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private Instant resendAvailableAt;

    @Column(nullable = false)
    private int failedAttempts;

    private Instant consumedAt;

    @Version
    private Long version;
}
