package com.tensignal.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

@Configuration
@Profile("prod")
public class ProductionPaymentSafetyConfiguration {
    private final PaymentProperties properties;
    private final Environment environment;

    public ProductionPaymentSafetyConfiguration(PaymentProperties properties) {
        this(properties, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ProductionPaymentSafetyConfiguration(PaymentProperties properties, Environment environment) {
        this.properties = properties;
        this.environment = environment;
    }

    @PostConstruct
    public void rejectTestPaymentProvider() {
        String provider = properties.getProvider() != null ? properties.getProvider().trim() : "";
        boolean isProductionEnv = isProductionEnvironment();

        if (isProductionEnv) {
            if ("disabled".equalsIgnoreCase(provider) || provider.isBlank()) {
                throw new IllegalStateException("Payment provider cannot be disabled in production deployment. Must configure 'lemonsqueezy'.");
            }
            if (!"lemonsqueezy".equalsIgnoreCase(provider)) {
                throw new IllegalStateException("Payment provider '" + provider + "' is not supported in production deployment. Expected 'lemonsqueezy'.");
            }
        } else {
            if ("test-hmac".equalsIgnoreCase(provider)) {
                throw new IllegalStateException("The test payment provider is forbidden in production.");
            }
            if (!"lemonsqueezy".equalsIgnoreCase(provider) && !"disabled".equalsIgnoreCase(provider) && !provider.isBlank()) {
                throw new IllegalStateException("Unsupported payment provider '" + provider + "' under production profile.");
            }
        }

        if ("lemonsqueezy".equalsIgnoreCase(provider)) {
            var ls = properties.getLemonSqueezy();
            if (ls == null) {
                throw new IllegalStateException("Lemon Squeezy properties must be configured in production.");
            }
            if (ls.getWebhookSecret() == null || ls.getWebhookSecret().isBlank()) {
                throw new IllegalStateException("LEMON_SQUEEZY_WEBHOOK_SECRET must be configured in production.");
            }
            String webhookSecret = ls.getWebhookSecret().trim();
            if (webhookSecret.contains("<") || webhookSecret.contains(">") || webhookSecret.contains("your_")
                || "your_lemon_squeezy_webhook_secret_here".equalsIgnoreCase(webhookSecret)) {
                throw new IllegalStateException("LEMON_SQUEEZY_WEBHOOK_SECRET cannot contain placeholder values.");
            }

            if (isProductionEnv) {
                if (ls.getApiKey() == null || ls.getApiKey().isBlank()) {
                    throw new IllegalStateException("LEMON_SQUEEZY_API_KEY must be configured in production deployment.");
                }
            }
            if (ls.getApiKey() != null && !ls.getApiKey().isBlank()) {
                String trimmedApiKey = ls.getApiKey().trim();
                if (trimmedApiKey.contains("<") || trimmedApiKey.contains(">") || trimmedApiKey.contains("your_")
                    || "your_lemon_squeezy_api_key_here".equalsIgnoreCase(trimmedApiKey)) {
                    throw new IllegalStateException("LEMON_SQUEEZY_API_KEY cannot contain placeholder values.");
                }
            }

            validateCheckoutUrl(ls.getPlusCheckoutUrl(), "LEMON_SQUEEZY_PLUS_CHECKOUT_URL");
            validateCheckoutUrl(ls.getCapacity50CheckoutUrl(), "LEMON_SQUEEZY_CAPACITY_50_CHECKOUT_URL");
            validateCheckoutUrl(ls.getCapacity150CheckoutUrl(), "LEMON_SQUEEZY_CAPACITY_150_CHECKOUT_URL");
            validateCheckoutUrl(ls.getCapacity300CheckoutUrl(), "LEMON_SQUEEZY_CAPACITY_300_CHECKOUT_URL");
        }
    }

    private boolean isProductionEnvironment() {
        if (environment == null) {
            return false;
        }
        String deployEnv = environment.getProperty("DEPLOYMENT_ENVIRONMENT");
        if (deployEnv == null || deployEnv.isBlank()) {
            deployEnv = environment.getProperty("ENVIRONMENT");
        }
        if (deployEnv == null || deployEnv.isBlank()) {
            deployEnv = environment.getProperty("APP_ENV");
        }
        return deployEnv != null &&
            ("production".equalsIgnoreCase(deployEnv.trim()) || "prod".equalsIgnoreCase(deployEnv.trim()));
    }

    private void validateCheckoutUrl(String url, String propertyName) {
        if (url == null || url.isBlank()) {
            throw new IllegalStateException(propertyName + " must be configured in production.");
        }
        String trimmed = url.trim();
        if (!trimmed.startsWith("https://")) {
            throw new IllegalStateException(propertyName + " must use HTTPS protocol: " + propertyName);
        }
        if (trimmed.contains("seenly.lemonsqueezy.com")) {
            throw new IllegalStateException(propertyName + " cannot use legacy seenly domain.");
        }
        if (trimmed.contains("<") || trimmed.contains(">") || trimmed.contains("your_") || trimmed.contains("placeholder")) {
            throw new IllegalStateException(propertyName + " cannot contain placeholder values.");
        }
    }
}
