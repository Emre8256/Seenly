package com.tensignal.backend.repository;

import com.tensignal.backend.entity.RateLimitBucket;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface RateLimitBucketRepository extends JpaRepository<RateLimitBucket, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from RateLimitBucket b where b.keyHash = :key")
    Optional<RateLimitBucket> findByKeyForUpdate(@Param("key") String key);

    @Query("select b.keyHash from RateLimitBucket b where b.expiresAt < :cutoff order by b.expiresAt")
    List<String> findExpiredKeys(@Param("cutoff") Instant cutoff, Pageable pageable);
}
