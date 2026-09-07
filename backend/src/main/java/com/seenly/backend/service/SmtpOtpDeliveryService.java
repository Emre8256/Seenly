package com.seenly.backend.service;

import com.seenly.backend.constant.OtpPurpose;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Profile("prod")
@RequiredArgsConstructor
public class SmtpOtpDeliveryService implements OtpDeliveryService {
    private final JavaMailSender mailSender;

    @Value("${app.auth.mail-from:no-reply@seenly.app}")
    private String mailFrom;

    @Override
    public void send(String email, String code, OtpPurpose purpose) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(email);
        message.setSubject("Seenly verification code");
        message.setText("Your Seenly verification code is " + code + ". It expires shortly and can be used once.");
        mailSender.send(message);
        log.info("Verification email accepted for delivery (purpose={})", purpose);
    }
}
