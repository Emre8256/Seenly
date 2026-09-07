package com.seenly.backend.repository;

import com.seenly.backend.entity.FriendResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface FriendResponseRepository extends JpaRepository<FriendResponse, UUID> {
    @Query("""
        select r.questionId as questionId, avg(r.answerValue) as averageValue
        from FriendResponse r
        where r.responseSession.seenly.id = :seenlyId
        group by r.questionId
        """)
    List<AnswerAverage> findAnswerAveragesBySeenlyId(@Param("seenlyId") UUID seenlyId);

    interface AnswerAverage {
        String getQuestionId();
        Double getAverageValue();
    }
}
