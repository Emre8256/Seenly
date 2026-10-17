package com.tensignal.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDto {
    @Builder.Default
    private boolean masterEmail = true;

    @Builder.Default
    private boolean evaluations = true;

    @Builder.Default
    private boolean reminders = true;

    @Builder.Default
    private boolean cardChanges = true;

    @Builder.Default
    private boolean capacityAlerts = true;
}
