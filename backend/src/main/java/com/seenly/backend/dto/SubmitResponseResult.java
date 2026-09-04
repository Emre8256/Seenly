package com.seenly.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitResponseResult {
    private String readerStyleId;
    private int xpGained;
    private int level;
    private double accuracy;
    private ResultSnapshotDto resultSnapshot;
}
