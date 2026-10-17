package com.tensignal.backend.email;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {

    FIRST_SHARE_REMINDER(NotificationCategory.REMINDERS, false, false),
    NEW_EVALUATION(NotificationCategory.EVALUATIONS, false, false),
    REPORT_UNLOCKED(NotificationCategory.REMINDERS, false, false),
    INACTIVITY_REMINDER(NotificationCategory.REMINDERS, false, false),
    CAPACITY_80_PERCENT(NotificationCategory.CAPACITY_ALERTS, false, false),
    CAPACITY_FULL(NotificationCategory.CAPACITY_ALERTS, false, false),
    PLUS_WELCOME(NotificationCategory.TRANSACTIONAL, true, false),
    PURCHASE_RECEIPT(NotificationCategory.TRANSACTIONAL, true, false),
    EMAIL_CHANGED(NotificationCategory.TRANSACTIONAL, true, false),
    ACCOUNT_DELETED(NotificationCategory.TRANSACTIONAL, true, false),
    LOGIN_VERIFICATION(NotificationCategory.TRANSACTIONAL, true, true),
    REGISTRATION_VERIFICATION(NotificationCategory.TRANSACTIONAL, true, true),
    EMAIL_CHANGE_VERIFICATION(NotificationCategory.TRANSACTIONAL, true, true),
    SOCIAL_CARD_CHANGED(NotificationCategory.CARD_CHANGES, false, false);

    private final NotificationCategory category;
    private final boolean transactional;
    private final boolean otp;

    public boolean isTransactional() {
        return transactional;
    }

    public boolean isOtp() {
        return otp;
    }
}
