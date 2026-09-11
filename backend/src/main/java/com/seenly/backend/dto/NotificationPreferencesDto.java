package com.seenly.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDto {
    private boolean evaluations;
    private boolean reminders;
    private boolean cardChanges;
    private boolean capacityAlerts;
}
