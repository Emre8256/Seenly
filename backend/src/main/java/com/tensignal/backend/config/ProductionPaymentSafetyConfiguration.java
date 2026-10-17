package com.tensignal.backend.config;

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
        if ("lemonsqueezy".equalsIgnoreCase(properties.getProvider())) {
            var ls = properties.getLemonSqueezy();
            if (ls == null || ls.getWebhookSecret() == null || ls.getWebhookSecret().isBlank()) {
                throw new IllegalStateException("LEMON_SQUEEZY_WEBHOOK_SECRET must be configured in production.");
            }
            if (ls.getPlusCheckoutUrl() == null || ls.getPlusCheckoutUrl().isBlank()) {
                throw new IllegalStateException("LEMON_SQUEEZY_PLUS_CHECKOUT_URL must be configured in production.");
            }
            if (ls.getCapacity100CheckoutUrl() == null || ls.getCapacity100CheckoutUrl().isBlank()) {
                throw new IllegalStateException("LEMON_SQUEEZY_CAPACITY_100_CHECKOUT_URL must be configured in production.");
            }
            if (ls.getCapacity250CheckoutUrl() == null || ls.getCapacity250CheckoutUrl().isBlank()) {
                throw new IllegalStateException("LEMON_SQUEEZY_CAPACITY_250_CHECKOUT_URL must be configured in production.");
            }
            if (ls.getCapacity500CheckoutUrl() == null || ls.getCapacity500CheckoutUrl().isBlank()) {
                throw new IllegalStateException("LEMON_SQUEEZY_CAPACITY_500_CHECKOUT_URL must be configured in production.");
            }
        }
    }
}
