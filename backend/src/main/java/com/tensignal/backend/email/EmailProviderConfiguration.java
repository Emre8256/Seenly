package com.tensignal.backend.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

@Slf4j
@Configuration
public class EmailProviderConfiguration {

    @Bean
    @ConditionalOnProperty(name = "app.email.provider", havingValue = "brevo", matchIfMissing = true)
    public EmailSender brevoEmailProvider(
            ObjectMapper objectMapper,
            @Value("${app.email.brevo.api-key:${BREVO_API_KEY:}}") String apiKey,
            @Value("${app.email.brevo.sender-email:${BREVO_SENDER_EMAIL:mail@10signal.me}}") String senderEmail,
            @Value("${app.email.brevo.sender-name:${BREVO_SENDER_NAME:10Signal}}") String senderName,
            @Value("${app.email.brevo.reply-to:${BREVO_REPLY_TO:10signal.me@gmail.com}}") String replyTo,
            @Value("${app.email.brevo.api-url:${BREVO_API_URL:https://api.brevo.com/v3/smtp/email}}") String apiUrl,
            @Value("${app.email.brevo.connect-timeout-ms:${BREVO_CONNECT_TIMEOUT_MS:5000}}") int connectTimeoutMs,
            @Value("${app.email.brevo.read-timeout-ms:${BREVO_READ_TIMEOUT_MS:10000}}") int readTimeoutMs) {
        boolean apiKeyPresent = apiKey != null && !apiKey.isBlank();
        log.info("Email configuration: provider=brevo, apiKeyPresent={}, sender={} <{}>, replyTo={}",
                apiKeyPresent, senderName, senderEmail, replyTo);
        if (!apiKeyPresent) {
            throw new IllegalStateException("BREVO_API_KEY must be configured when app.email.provider=brevo");
        }
        log.info("Email provider selected: brevo (sender={} <{}>)", senderName, senderEmail);
        return new BrevoEmailProvider(
                apiKey.trim(),
                senderEmail.trim(),
                senderName.trim(),
                replyTo.trim(),
                apiUrl.trim(),
                connectTimeoutMs,
                readTimeoutMs,
                objectMapper
        );
    }

    @Bean
    @ConditionalOnProperty(name = "app.email.provider", havingValue = "smtp")
    public EmailSender smtpEmailProvider(
            JavaMailSender mailSender,
            @Value("${app.email.brevo.sender-email:${app.email.mail-from:mail@10signal.me}}") String mailFrom) {
        log.info("Email configuration: provider=smtp, sender={}", mailFrom);
        log.info("Email provider selected: smtp (sender={})", mailFrom);
        return new SmtpEmailProvider(mailSender, mailFrom);
    }

    @Bean
    @ConditionalOnProperty(name = "app.email.provider", havingValue = "disabled")
    public EmailSender disabledEmailProvider(
            @Value("${app.email.brevo.api-key:${BREVO_API_KEY:}}") String brevoApiKey,
            @Value("${app.email.brevo.sender-email:${app.email.mail-from:mail@10signal.me}}") String mailFrom) {
        boolean brevoPresent = brevoApiKey != null && !brevoApiKey.isBlank();
        log.info("Email configuration: provider=disabled, brevoApiKeyPresent={}, sender={}",
                brevoPresent, mailFrom);
        log.info("Email provider selected: disabled");
        return new DisabledEmailProvider();
    }
}
