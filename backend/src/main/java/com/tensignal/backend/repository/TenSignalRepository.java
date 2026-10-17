package com.tensignal.backend.repository;

import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenSignalRepository extends JpaRepository<TenSignal, UUID> {

    @EntityGraph(attributePaths = {"resultSnapshot", "user", "selfAnswers"})
    Optional<TenSignal> findByPublicSlug(String publicSlug);

    @EntityGraph(attributePaths = {"resultSnapshot", "user"})
    @Query("select s from TenSignal s where s.publicSlug = :publicSlug")
    Optional<TenSignal> findPublicProfileBySlug(@Param("publicSlug") String publicSlug);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from TenSignal s where s.publicSlug = :publicSlug")
    Optional<TenSignal> findByPublicSlugForUpdate(@Param("publicSlug") String publicSlug);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from TenSignal s where s.id = :id")
    Optional<TenSignal> findByIdForUpdate(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"resultSnapshot", "user", "selfAnswers"})
    Optional<TenSignal> findByOwnerTokenHash(String ownerTokenHash);

    Optional<TenSignal> findFirstByEmailOrderByCreatedAtDesc(String email);

    Optional<TenSignal> findByEmail(String email);

    boolean existsByEmail(String email);

    List<TenSignal> findByUser(User user);
}
