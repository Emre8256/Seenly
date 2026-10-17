package com.tensignal.backend.repository;

import com.tensignal.backend.entity.ResultSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ResultSnapshotRepository extends JpaRepository<ResultSnapshot, UUID> {
}
