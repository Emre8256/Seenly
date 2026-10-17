package com.tensignal.backend.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
public class SmtpEmailProvider implements EmailSender {

    private final JavaMailSender mailSender;
    private final String defaultMailFrom;

    @Override
    public EmailSendResult send(EmailMessage message) {
        String messageId = UUID.randomUUID().toString();
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            // true indicates multipart
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, StandardCharsets.UTF_8.name());

            helper.setFrom(defaultMailFrom);
            helper.setTo(message.getTo());
            helper.setSubject(message.getSubject());
            if (message.getReplyTo() != null && !message.getReplyTo().isBlank()) {
                helper.setReplyTo(message.getReplyTo());
            }

            // set text (plain text) and html
            helper.setText(message.getTextBody(), message.getHtmlBody());
            mimeMessage.setHeader("X-Notification-Type", message.getNotificationType());
            mimeMessage.setHeader("X-Message-ID", messageId);

            mailSender.send(mimeMessage);
            log.info("Email delivered via SMTP (type={}, msgId={})", message.getNotificationType(), messageId);
            return EmailSendResult.success(messageId);

        } catch (MailAuthenticationException ex) {
            log.error("SMTP authentication failed for notificationType={}", message.getNotificationType());
            // Auth error is typically configuration failure, non-retryable without config fix
            return EmailSendResult.failure("SMTP authentication error: " + ex.getMessage(), false);

        } catch (MailSendException ex) {
            log.warn("SMTP transient send error for notificationType={}: {}", message.getNotificationType(), ex.getMessage());
            return EmailSendResult.failure("SMTP send error: " + ex.getMessage(), true);

        } catch (MailException | MessagingException ex) {
            log.warn("SMTP failure for notificationType={}: {}", message.getNotificationType(), ex.getMessage());
            return EmailSendResult.failure("SMTP error: " + ex.getMessage(), true);

        } catch (Exception ex) {
            log.error("Unexpected error sending email via SMTP for notificationType={}: {}", message.getNotificationType(), ex.getMessage());
            return EmailSendResult.failure("Unexpected error: " + ex.getMessage(), false);
        }
    }

    @Override
    public String getProviderId() {
        return "smtp";
    }
}
