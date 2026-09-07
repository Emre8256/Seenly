package com.seenly.backend.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("prod")
@RequiredArgsConstructor
public class ProductionPaymentSafetyConfiguration {
    private final PaymentProperties properties;

    @PostConstruct
    public void rejectTestPaymentProvider() {
        if ("test-hmac".equalsIgnoreCase(properties.getProvider())) {
            throw new IllegalStateException("The test payment provider is forbidden in production.");
        }
    }
}
