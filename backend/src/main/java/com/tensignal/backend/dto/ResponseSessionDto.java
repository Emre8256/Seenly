package com.tensignal.backend.dto;

import com.tensignal.backend.entity.ResponseSession;
import com.tensignal.backend.service.SnapshotMapperService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponseSessionDto {
    private UUID id;
    private String nickname;
    private ZonedDateTime completedAt;
    private Map<String, Integer> signals;
    private String readerType;
    private double accuracy;
    private Map<String, Integer> friendTimeAnalytics;

    /**
     * Backward-compatible constructor delegating to mapper.
     */
    public ResponseSessionDto(ResponseSession session, Map<String, Integer> selfAnswersMap) {
        if (session == null) {
            throw new IllegalArgumentException("Session cannot be null");
        }
        SnapshotMapperService mapper = new SnapshotMapperService();
        ResponseSessionDto mapped = mapper.toSessionDto(session, selfAnswersMap);
        this.id = mapped.id;
        this.nickname = mapped.nickname;
        this.completedAt = mapped.completedAt;
        this.signals = mapped.signals;
        this.readerType = mapped.readerType;
        this.accuracy = mapped.accuracy;
        this.friendTimeAnalytics = mapped.friendTimeAnalytics;
    }
}
