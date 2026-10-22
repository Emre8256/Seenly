package com.tensignal.backend.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import java.util.Locale;

@Configuration
@Profile("prod")
public class ProductionSafetyConfiguration {

    @Bean
    public InitializingBean validateProductionConfiguration(Environment environment, SecurityProperties security) {
        return () -> {
            String url = required(environment, "spring.datasource.url");
            String username = required(environment, "spring.datasource.username");
            String password = required(environment, "spring.datasource.password");
            String emailProvider = environment.getProperty("app.email.provider");
            if (emailProvider == null || emailProvider.isBlank()) {
                String smtpHost = environment.getProperty("spring.mail.host");
                emailProvider = (smtpHost != null && !smtpHost.isBlank()) ? "smtp" : "brevo";
            }

            if ("brevo".equalsIgnoreCase(emailProvider)) {
                String brevoKey = environment.getProperty("app.email.brevo.api-key");
                if (brevoKey == null || brevoKey.isBlank()) {
                    brevoKey = environment.getProperty("BREVO_API_KEY");
                }
                if (brevoKey == null || brevoKey.isBlank()) {
                    throw new IllegalStateException("Required production property is missing: app.email.brevo.api-key (BREVO_API_KEY)");
                }
            } else if ("smtp".equalsIgnoreCase(emailProvider)) {
                required(environment, "spring.mail.host");
                required(environment, "spring.mail.username");
                required(environment, "spring.mail.password");
            } else if ("disabled".equalsIgnoreCase(emailProvider)) {
                throw new IllegalStateException("Production email provider cannot be disabled. Must be 'brevo' or 'smtp'.");
            }

            String mailFrom = environment.getProperty("app.email.brevo.sender-email");
            if (mailFrom == null || mailFrom.isBlank()) {
                mailFrom = environment.getProperty("app.email.mail-from");
            }
            if (mailFrom == null || mailFrom.isBlank()) {
                mailFrom = environment.getProperty("AUTH_MAIL_FROM");
            }
            if (mailFrom == null || mailFrom.isBlank()) {
                mailFrom = environment.getProperty("app.auth.mail-from");
            }
            if (mailFrom == null || mailFrom.isBlank()) {
                throw new IllegalStateException("Required production property is missing: app.email.brevo.sender-email (BREVO_SENDER_EMAIL)");
            }
            if (!url.toLowerCase(Locale.ROOT).startsWith("jdbc:postgresql:")) {
                throw new IllegalStateException("Production datasource must use PostgreSQL.");
            }
            if ("postgres".equalsIgnoreCase(username) && "postgres".equals(password)) {
                throw new IllegalStateException("Default postgres/postgres credentials are forbidden in production.");
            }
            if (!"validate".equalsIgnoreCase(environment.getProperty("spring.jpa.hibernate.ddl-auto"))) {
                throw new IllegalStateException("Production Hibernate ddl-auto must be validate.");
            }

            // OTP Payload Secret hardening
            String otpSecret = environment.getProperty("app.email.outbox.otp-payload-secret");
            if (otpSecret == null || otpSecret.isBlank()) {
                otpSecret = environment.getProperty("EMAIL_OTP_PAYLOAD_SECRET");
            }
            if (otpSecret == null || otpSecret.isBlank()) {
                throw new IllegalStateException("Required production property is missing: app.email.outbox.otp-payload-secret (EMAIL_OTP_PAYLOAD_SECRET)");
            }
            String trimmedOtpSecret = otpSecret.trim();
            if ("seenly-default-secure-otp-payload-key-256bit".equalsIgnoreCase(trimmedOtpSecret)
                || "change-this-to-a-secure-256bit-secret-in-production".equalsIgnoreCase(trimmedOtpSecret)) {
                throw new IllegalStateException("Production OTP payload secret cannot use the insecure default/placeholder secret.");
            }
            if (trimmedOtpSecret.length() < 32) {
                throw new IllegalStateException("Production OTP payload secret must be at least 32 characters (256 bits).");
            }
            long distinctChars = trimmedOtpSecret.chars().distinct().count();
            if (distinctChars < 10) {
                throw new IllegalStateException("Production OTP payload secret must have sufficient character diversity.");
            }

            // CORS origins validation
            if (security.getAllowedOrigins().isEmpty()
                    || security.getAllowedOrigins().stream().anyMatch(origin -> origin == null || origin.contains("*"))) {
                throw new IllegalStateException("Production CORS origins must be an explicit non-wildcard allowlist.");
            }
            for (String origin : security.getAllowedOrigins()) {
                if (origin == null || origin.isBlank()) continue;
                String trimmedOrigin = origin.trim();
                if (security.isRequireHttps() && !trimmedOrigin.startsWith("https://")) {
                    throw new IllegalStateException("Production CORS origin must use HTTPS: " + trimmedOrigin);
                }
                if (trimmedOrigin.contains("localhost") || trimmedOrigin.contains("127.0.0.1")) {
                    throw new IllegalStateException("Development localhost origins are forbidden in production CORS configuration: " + trimmedOrigin);
                }
            }

            // Trusted proxy CIDR safety validation
            if (security.getTrustedProxyCidrs() != null) {
                for (String cidr : security.getTrustedProxyCidrs()) {
                    if (cidr == null || cidr.isBlank()) continue;
                    String trimmedCidr = cidr.trim();
                    if ("0.0.0.0/0".equals(trimmedCidr) || "::/0".equals(trimmedCidr) || trimmedCidr.contains("*")) {
                        throw new IllegalStateException("Overly permissive or wildcard trusted proxy CIDR is strictly forbidden: " + trimmedCidr);
                    }
                }
            }
        };
    }

    private String required(Environment environment, String key) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Required production property is missing: " + key);
        }
        return value.trim();
    }
}
