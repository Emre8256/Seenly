package com.seenly.backend.repository;

import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
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
public interface SeenlyRepository extends JpaRepository<Seenly, UUID> {

    @EntityGraph(attributePaths = {"resultSnapshot", "user", "selfAnswers"})
    Optional<Seenly> findByPublicSlug(String publicSlug);

    @EntityGraph(attributePaths = {"resultSnapshot", "user"})
    @Query("select s from Seenly s where s.publicSlug = :publicSlug")
    Optional<Seenly> findPublicProfileBySlug(@Param("publicSlug") String publicSlug);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Seenly s where s.publicSlug = :publicSlug")
    Optional<Seenly> findByPublicSlugForUpdate(@Param("publicSlug") String publicSlug);

    @EntityGraph(attributePaths = {"resultSnapshot", "user", "selfAnswers"})
    Optional<Seenly> findByOwnerTokenHash(String ownerTokenHash);

    Optional<Seenly> findFirstByEmailOrderByCreatedAtDesc(String email);

    Optional<Seenly> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Seenly> findByUser(User user);
}
