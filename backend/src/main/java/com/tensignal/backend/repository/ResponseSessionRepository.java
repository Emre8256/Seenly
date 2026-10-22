package com.tensignal.backend.repository;

import com.tensignal.backend.entity.ResponseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.SliceImpl;
import java.util.*;

@Repository
public interface ResponseSessionRepository extends JpaRepository<ResponseSession, UUID> {
    boolean existsBySeenlyIdAndFingerprintHash(UUID seenlyId, String fingerprintHash);
    long countBySeenlyId(UUID seenlyId);

    @Query("""
        select session.id from ResponseSession session
        where session.seenly.id = :seenlyId
        order by session.createdAt desc, session.id desc
        """)
    Slice<UUID> findOwnerHistoryIdsInitial(
        @Param("seenlyId") UUID seenlyId,
        Pageable pageable);

    @Query("""
        select session.id from ResponseSession session
        where session.seenly.id = :seenlyId
          and (session.createdAt < :before
            or (session.createdAt = :before and session.id < :beforeId))
        order by session.createdAt desc, session.id desc
        """)
    Slice<UUID> findOwnerHistoryIdsWithCursor(
        @Param("seenlyId") UUID seenlyId,
        @Param("before") LocalDateTime before,
        @Param("beforeId") UUID beforeId,
        Pageable pageable);

    @EntityGraph(attributePaths = {"responses"})
    @Query("""
        select distinct session from ResponseSession session
        where session.id in :ids
        """)
    List<ResponseSession> findSessionsWithResponsesByIdIn(@Param("ids") Collection<UUID> ids);

    default Slice<ResponseSession> findOwnerHistory(
        UUID seenlyId,
        LocalDateTime before,
        UUID beforeId,
        Pageable pageable) {
        Slice<UUID> idSlice = (before == null)
            ? findOwnerHistoryIdsInitial(seenlyId, pageable)
            : findOwnerHistoryIdsWithCursor(seenlyId, before, beforeId, pageable);

        if (idSlice.isEmpty()) {
            return new SliceImpl<>(List.of(), pageable, false);
        }

        List<UUID> ids = idSlice.getContent();
        List<ResponseSession> sessions = findSessionsWithResponsesByIdIn(ids);
        Map<UUID, ResponseSession> sessionMap = new HashMap<>();
        for (ResponseSession session : sessions) {
            sessionMap.put(session.getId(), session);
        }

        List<ResponseSession> ordered = new ArrayList<>(ids.size());
        for (UUID id : ids) {
            ResponseSession session = sessionMap.get(id);
            if (session != null) {
                if (session.getFriendTimeAnalytics() != null) {
                    session.getFriendTimeAnalytics().size();
                }
                ordered.add(session);
            }
        }

        return new SliceImpl<>(ordered, pageable, idSlice.hasNext());
    }

    default Slice<ResponseSession> findOwnerHistoryInitial(
        UUID seenlyId,
        Pageable pageable) {
        return findOwnerHistory(seenlyId, null, null, pageable);
    }

    default Slice<ResponseSession> findOwnerHistoryWithCursor(
        UUID seenlyId,
        LocalDateTime before,
        UUID beforeId,
        Pageable pageable) {
        return findOwnerHistory(seenlyId, before, beforeId, pageable);
    }

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
