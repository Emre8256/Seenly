package com.tensignal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Result returned to the participant who just completed an assessment.
 * It intentionally contains no owner dashboard or other participants' data.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantSubmissionResultDto {
    private String readerStyleId;
    private int xpGained;
    private int level;
    private double accuracy;
}
