package com.seenly.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "seenlys", indexes = {
    @Index(name = "idx_seenly_public_slug", columnList = "publicSlug", unique = true),
    @Index(name = "idx_seenly_owner_token_hash", columnList = "ownerTokenHash", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seenly {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Nullable relation to User: allows anonymous first-time quiz generation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String publicSlug;

    @Column(nullable = false, unique = true)
    private String ownerTokenHash;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = true)
    private String email;

    @Column(nullable = true)
    private String avatar;

    @Column(nullable = true)
    private LocalDateTime lastNameChangedAt;

    @Column(nullable = false)
    private int responseCount = 0;

    @Column(nullable = false)
    private int totalProfileClicks = 0;

    @Column(nullable = false)
    private boolean isCapped = false;

    @Version
    private Long version; // Concurrency protection against race conditions on free_cap

    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "seenly", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ResultSnapshot resultSnapshot;

    @OneToMany(mappedBy = "seenly", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SelfAnswer> selfAnswers;

    @OneToMany(mappedBy = "seenly", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ResponseSession> responseSessions;

    public boolean getIsPremium() {
        return user != null && Boolean.TRUE.equals(user.getIsPremium());
    }

    public int getBaseFormCapacity() {
        return user != null && user.getBaseFormCapacity() != null ? user.getBaseFormCapacity() : 3;
    }

    public int getPurchasedExtraCapacity() {
        return user != null && user.getPurchasedExtraCapacity() != null ? user.getPurchasedExtraCapacity() : 0;
    }
}
