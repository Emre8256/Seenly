package com.seenly.backend.repository;

import com.seenly.backend.entity.VerificationGrant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.time.Instant;
import org.springframework.data.domain.Pageable;

public interface VerificationGrantRepository extends JpaRepository<VerificationGrant, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from VerificationGrant g where g.tokenHash = :hash")
    Optional<VerificationGrant> findByHashForUpdate(@Param("hash") String hash);

    @Query("select g.tokenHash from VerificationGrant g where g.expiresAt < :cutoff order by g.expiresAt")
    List<String> findExpiredKeys(@Param("cutoff") Instant cutoff, Pageable pageable);
}
