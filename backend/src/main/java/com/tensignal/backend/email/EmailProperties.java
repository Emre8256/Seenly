package com.tensignal.backend.email;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.email")
public class EmailProperties {

    private String provider = "brevo";
    private String mailFrom = "mail@10signal.me";
    private BrevoProperties brevo = new BrevoProperties();
    private OutboxProperties outbox = new OutboxProperties();
    private LifecycleProperties lifecycle = new LifecycleProperties();

    @Getter
    @Setter
    public static class BrevoProperties {
        private String apiKey = "";
        private String senderEmail = "mail@10signal.me";
        private String senderName = "10Signal";
        private String replyTo = "10signal.me@gmail.com";
        private String apiUrl = "https://api.brevo.com/v3/smtp/email";
        private int connectTimeoutMs = 5000;
        private int readTimeoutMs = 10000;
    }

    @Getter
    @Setter
    public static class OutboxProperties {
        private int batchSize = 20;
        private long workerIntervalMs = 5000;
        private String otpPayloadSecret = "seenly-default-secure-otp-payload-key-256bit";
    }

    @Getter
    @Setter
    public static class LifecycleProperties {
        private int inactivityDays = 7;
        private int cooldownDays = 30;
        private long checkIntervalMs = 3600000;
    }
}
