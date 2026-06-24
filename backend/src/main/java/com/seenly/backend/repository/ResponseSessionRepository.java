package com.seenly.backend.repository;

import com.seenly.backend.entity.ResponseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ResponseSessionRepository extends JpaRepository<ResponseSession, UUID> {
}
