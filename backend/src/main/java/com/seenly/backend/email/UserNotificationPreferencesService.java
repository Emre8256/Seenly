package com.seenly.backend.email;

import com.seenly.backend.dto.NotificationPreferencesDto;
import com.seenly.backend.entity.User;
import com.seenly.backend.entity.UserNotificationPreferences;
import com.seenly.backend.repository.UserNotificationPreferencesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserNotificationPreferencesService {

    private final UserNotificationPreferencesRepository preferencesRepository;

    @Transactional(readOnly = true)
    public boolean isAllowed(UUID userId, NotificationType type) {
        if (type.isTransactional()) {
            return true;
        }
        if (userId == null) {
            return true;
        }

        Optional<UserNotificationPreferences> prefsOpt = preferencesRepository.findByUserId(userId);
        if (prefsOpt.isEmpty()) {
            return true; // default all enabled
        }

        UserNotificationPreferences prefs = prefsOpt.get();
        return switch (type.getCategory()) {
            case EVALUATIONS -> prefs.isEvaluationsEnabled();
            case REMINDERS -> prefs.isRemindersEnabled();
            case CARD_CHANGES -> prefs.isCardChangesEnabled();
            case CAPACITY_ALERTS -> prefs.isCapacityAlertsEnabled();
            default -> true;
        };
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesDto getPreferences(User user) {
        if (user == null) {
            return NotificationPreferencesDto.builder()
                .evaluations(true)
                .reminders(true)
                .cardChanges(true)
                .capacityAlerts(true)
                .build();
        }

        return preferencesRepository.findByUserId(user.getId())
            .map(this::toDto)
            .orElseGet(() -> NotificationPreferencesDto.builder()
                .evaluations(true)
                .reminders(true)
                .cardChanges(true)
                .capacityAlerts(true)
                .build());
    }

    @Transactional
    public NotificationPreferencesDto updatePreferences(User user, NotificationPreferencesDto dto) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null when updating notification preferences");
        }

        UserNotificationPreferences entity = preferencesRepository.findByUserId(user.getId())
            .orElseGet(() -> UserNotificationPreferences.builder().user(user).build());

        entity.setEvaluationsEnabled(dto.isEvaluations());
        entity.setRemindersEnabled(dto.isReminders());
        entity.setCardChangesEnabled(dto.isCardChanges());
        entity.setCapacityAlertsEnabled(dto.isCapacityAlerts());

        preferencesRepository.save(entity);
        return toDto(entity);
    }

    private NotificationPreferencesDto toDto(UserNotificationPreferences entity) {
        return NotificationPreferencesDto.builder()
            .evaluations(entity.isEvaluationsEnabled())
            .reminders(entity.isRemindersEnabled())
            .cardChanges(entity.isCardChangesEnabled())
            .capacityAlerts(entity.isCapacityAlertsEnabled())
            .build();
    }
}
