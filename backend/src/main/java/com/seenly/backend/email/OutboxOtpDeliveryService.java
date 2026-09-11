package com.seenly.backend.email;

import com.seenly.backend.constant.OtpPurpose;
import com.seenly.backend.service.OtpDeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class OutboxOtpDeliveryService implements OtpDeliveryService {

    private final EmailNotificationService emailNotificationService;
    private final Clock clock;

    @Value("${app.auth.otp-ttl:PT10M}")
    private Duration otpTtl;

    @Override
    public void send(String email, String code, OtpPurpose purpose) {
        NotificationType type = switch (purpose) {
            case REGISTER -> NotificationType.REGISTRATION_VERIFICATION;
            case LOGIN -> NotificationType.LOGIN_VERIFICATION;
            case EMAIL_CHANGE -> NotificationType.EMAIL_CHANGE_VERIFICATION;
        };

        Instant now = clock.instant();
        Instant expiresAt = now.plus(otpTtl);
        String recipientHash = EmailNotificationService.hashRecipient(email);
        String idempotencyKey = "otp-" + purpose.name().toLowerCase(java.util.Locale.ROOT) + ":" + recipientHash + ":" + now.toEpochMilli();

        emailNotificationService.enqueueOtp(type, email, code, expiresAt, idempotencyKey);
        log.info("Enqueued OTP delivery to outbox for purpose={}", purpose);
    }
}
