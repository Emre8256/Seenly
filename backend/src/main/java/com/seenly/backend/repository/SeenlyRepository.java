package com.seenly.backend.repository;

import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SeenlyRepository extends JpaRepository<Seenly, UUID> {

    @EntityGraph(attributePaths = {"resultSnapshot", "user", "selfAnswers"})
    Optional<Seenly> findByPublicSlug(String publicSlug);

    @EntityGraph(attributePaths = {"resultSnapshot", "user", "selfAnswers"})
    Optional<Seenly> findByOwnerTokenHash(String ownerTokenHash);

    Optional<Seenly> findFirstByEmailOrderByCreatedAtDesc(String email);

    Optional<Seenly> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Seenly> findByUser(User user);
}
