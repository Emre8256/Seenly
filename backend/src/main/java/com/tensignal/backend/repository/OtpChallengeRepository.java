package com.tensignal.backend.repository;

import com.tensignal.backend.constant.OtpPurpose;
import com.tensignal.backend.entity.OtpChallenge;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;
import java.time.Instant;
import org.springframework.data.domain.Pageable;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from OtpChallenge o where o.challengeKey = :key")
    Optional<OtpChallenge> findByKeyForUpdate(@Param("key") String key);

    @Query("select o.challengeKey from OtpChallenge o where o.expiresAt < :cutoff order by o.expiresAt")
    List<String> findExpiredKeys(@Param("cutoff") Instant cutoff, Pageable pageable);

    @Modifying
    @Query("update OtpChallenge o set o.consumedAt = :now where o.ownerProfileId = :ownerId and o.purpose = :purpose and o.consumedAt is null")
    int invalidatePendingChallengesForOwner(@Param("ownerId") UUID ownerId, @Param("purpose") OtpPurpose purpose, @Param("now") Instant now);
}
