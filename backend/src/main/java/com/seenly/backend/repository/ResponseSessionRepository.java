package com.seenly.backend.repository;

import com.seenly.backend.entity.ResponseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ResponseSessionRepository extends JpaRepository<ResponseSession, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) > 0 FROM ResponseSession r WHERE r.seenly.id = :seenlyId AND (r.ipAddress = :ipAddress OR r.fingerprintHash = :fingerprintHash)")
    boolean existsDuplicateSession(@org.springframework.data.repository.query.Param("seenlyId") UUID seenlyId, @org.springframework.data.repository.query.Param("ipAddress") String ipAddress, @org.springframework.data.repository.query.Param("fingerprintHash") String fingerprintHash);
}
