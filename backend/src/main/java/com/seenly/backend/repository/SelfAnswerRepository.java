package com.seenly.backend.repository;

import com.seenly.backend.entity.SelfAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SelfAnswerRepository extends JpaRepository<SelfAnswer, UUID> {
}
