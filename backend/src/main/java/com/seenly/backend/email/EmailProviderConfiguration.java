package com.seenly.backend.email;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

@Configuration
public class EmailProviderConfiguration {

    @Bean
    @ConditionalOnProperty(name = "app.email.provider", havingValue = "smtp")
    public EmailSender smtpEmailProvider(
            JavaMailSender mailSender,
            @Value("${app.email.mail-from:${app.auth.mail-from:no-reply@seenly.app}}") String mailFrom) {
        return new SmtpEmailProvider(mailSender, mailFrom);
    }

    @Bean
    @ConditionalOnProperty(name = "app.email.provider", havingValue = "disabled", matchIfMissing = true)
    public EmailSender disabledEmailProvider() {
        return new DisabledEmailProvider();
    }
}
