package com.seenly.backend.repository;

import com.seenly.backend.entity.Seenly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SeenlyRepository extends JpaRepository<Seenly, UUID> {
    Optional<Seenly> findByPublicSlug(String publicSlug);
    Optional<Seenly> findByOwnerTokenHash(String ownerTokenHash);
    Optional<Seenly> findFirstByEmailOrderByCreatedAtDesc(String email);
}

