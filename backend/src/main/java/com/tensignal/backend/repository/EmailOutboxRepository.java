package com.tensignal.backend.repository;

import com.tensignal.backend.entity.EmailOutboxEntity;
import com.tensignal.backend.entity.EmailOutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailOutboxRepository extends JpaRepository<EmailOutboxEntity, UUID> {

    Optional<EmailOutboxEntity> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT e FROM EmailOutboxEntity e WHERE e.idempotencyKey = :idempotencyKey AND e.status = :status")
    Optional<EmailOutboxEntity> findByIdempotencyKeyAndStatus(
        @Param("idempotencyKey") String idempotencyKey,
        @Param("status") EmailOutboxStatus status
    );

    @Query(value = """
        SELECT * FROM email_outbox
        WHERE status = 'PENDING'
          AND next_attempt_at <= :now
          AND scheduled_at <= :now
        ORDER BY scheduled_at ASC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
        """, nativeQuery = true)
    List<EmailOutboxEntity> claimPendingBatch(@Param("now") Instant now, @Param("limit") int limit);

    long countByStatus(EmailOutboxStatus status);

    boolean existsByRecipientHashAndNotificationTypeAndCreatedAtAfter(
        String recipientHash, String notificationType, Instant after);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("UPDATE EmailOutboxEntity e SET e.status = 'SKIPPED', e.updatedAt = :now WHERE e.idempotencyKey LIKE :prefix AND e.status = 'PENDING'")
    int cancelPendingByPrefix(@Param("prefix") String prefix, @Param("now") Instant now);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("UPDATE EmailOutboxEntity e SET e.status = 'SKIPPED', e.updatedAt = :now WHERE e.status = 'PENDING' AND e.expiresAt IS NOT NULL AND e.expiresAt <= :now")
    int markExpiredAsSkipped(@Param("now") Instant now);

    @Query(value = "SELECT * FROM email_outbox WHERE recipient_hash = :hash AND notification_type = :type ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<EmailOutboxEntity> findLatestByRecipientHashAndType(@Param("hash") String hash, @Param("type") String type);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("UPDATE EmailOutboxEntity e SET e.recipient = :newRecipient, e.recipientHash = :newHash, e.updatedAt = :now WHERE e.status = 'PENDING' AND e.notificationType <> 'EMAIL_CHANGED' AND ( (:userId IS NOT NULL AND e.userId = :userId) OR e.idempotencyKey LIKE :keyPrefix )")
    int redirectPendingRecipientForAccount(
        @Param("userId") UUID userId,
        @Param("keyPrefix") String keyPrefix,
        @Param("newRecipient") String newRecipient,
        @Param("newHash") String newHash,
        @Param("now") Instant now
    );
}
