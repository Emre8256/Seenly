package com.seenly.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.payment")
public class PaymentProperties {
    private String provider = "disabled";
    private String testWebhookSecret = "";
    private int maxWebhookBytes = 65_536;
}
