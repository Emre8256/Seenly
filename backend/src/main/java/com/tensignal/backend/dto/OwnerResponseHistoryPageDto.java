package com.tensignal.backend.dto;

import java.util.List;

public record OwnerResponseHistoryPageDto(
    List<ResponseSessionDto> items,
    String nextCursor,
    boolean hasMore,
    long totalCount
) {}
