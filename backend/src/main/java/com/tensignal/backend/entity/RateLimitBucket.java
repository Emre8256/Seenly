package com.tensignal.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "rate_limit_buckets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateLimitBucket {
    @Id
    @Column(length = 64)
    private String keyHash;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(nullable = false)
    private Instant windowStartedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private int requestCount;

    @Version
    private Long version;
}
