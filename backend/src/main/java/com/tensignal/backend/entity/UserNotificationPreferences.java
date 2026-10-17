package com.tensignal.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_notification_preferences", indexes = {
    @Index(name = "uk_user_notification_prefs_user", columnList = "user_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    @Column(nullable = false)
    private boolean masterEnabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean evaluationsEnabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean remindersEnabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean cardChangesEnabled = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean capacityAlertsEnabled = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
