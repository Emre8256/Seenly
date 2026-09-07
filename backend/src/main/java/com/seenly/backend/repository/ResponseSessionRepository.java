package com.seenly.backend.repository;

import com.seenly.backend.entity.ResponseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface ResponseSessionRepository extends JpaRepository<ResponseSession, UUID> {
    boolean existsBySeenlyIdAndFingerprintHash(UUID seenlyId, String fingerprintHash);
    long countBySeenlyId(UUID seenlyId);

    @EntityGraph(attributePaths = {"responses", "friendTimeAnalytics"})
    @Query("""
        select session from ResponseSession session
        where session.seenly.id = :seenlyId
          and (:before is null
            or session.createdAt < :before
            or (session.createdAt = :before and session.id < :beforeId))
        order by session.createdAt desc, session.id desc
        """)
    Slice<ResponseSession> findOwnerHistory(
        @Param("seenlyId") UUID seenlyId,
        @Param("before") LocalDateTime before,
        @Param("beforeId") UUID beforeId,
        Pageable pageable);

    interface TimeAverage {
        String getSignalKey();
        Double getAverageValue();
    }

    @Query(value = """
        select analytics.signal_key as signalKey, avg(analytics.duration_ms) as averageValue
        from response_session_time_analytics analytics
        join response_sessions session on session.id = analytics.session_id
        where session.seenly_id = :seenlyId
        group by analytics.signal_key
        """, nativeQuery = true)
    java.util.List<TimeAverage> findTimeAveragesBySeenlyId(@Param("seenlyId") UUID seenlyId);
}
