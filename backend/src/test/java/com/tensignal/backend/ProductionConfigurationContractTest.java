package com.tensignal.backend;

import com.tensignal.backend.config.ProductionSafetyConfiguration;
import com.tensignal.backend.config.SecurityProperties;
import com.tensignal.backend.config.PaymentProperties;
import com.tensignal.backend.config.ProductionPaymentSafetyConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionConfigurationContractTest {

    @Test
    void commonConfigurationHasNoDatasourceFallbackAndProductionIsFailClosed() throws Exception {
        PropertySource<?> common = load("application.yml");
        PropertySource<?> prod = load("application-prod.yml");

        assertThat(common.getProperty("spring.datasource.url")).isNull();
        assertThat(prod.getProperty("spring.datasource.url")).isEqualTo("${SPRING_DATASOURCE_URL}");
        assertThat(prod.getProperty("spring.datasource.username")).isEqualTo("${SPRING_DATASOURCE_USERNAME}");
        assertThat(prod.getProperty("spring.datasource.password")).isEqualTo("${SPRING_DATASOURCE_PASSWORD}");
        assertThat(prod.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(prod.getProperty("spring.flyway.enabled")).isEqualTo(true);
        assertThat(prod.getProperty("spring.flyway.clean-disabled")).isEqualTo(true);
        assertThat(prod.getProperty("app.security.allowed-origins")).isEqualTo("${CORS_ALLOWED_ORIGINS}");
        assertThat(prod.getProperty("app.payment.provider")).isEqualTo("${PAYMENT_PROVIDER:disabled}");
        assertThat(prod.getProperty("app.email.provider")).isEqualTo("${EMAIL_PROVIDER:brevo}");
        assertThat(prod.getProperty("app.email.brevo.api-key")).isEqualTo("${BREVO_API_KEY:}");
        assertThat(common.getProperty("management.endpoints.web.exposure.include")).isEqualTo("health");
        assertThat(prod.getProperty("management.endpoints.web.exposure.include")).isEqualTo("health,prometheus");
        assertThat(prod.getProperty("management.server.port")).isEqualTo("${MANAGEMENT_PORT:8081}");
        assertThat(common.getProperty("management.endpoint.health.show-details")).isEqualTo("never");
        assertThat(common.getProperty("management.endpoint.health.group.readiness.include"))
            .isEqualTo("readinessState,db");
        assertThat(common.getProperty("server.shutdown")).isEqualTo("graceful");
        assertThat(common.getProperty("spring.lifecycle.timeout-per-shutdown-phase")).isEqualTo("20s");
        assertThat(prod.getProperty("spring.mail.properties.mail.smtp.connectiontimeout"))
            .isEqualTo("${SMTP_CONNECTION_TIMEOUT_MS:5000}");
        assertThat(prod.getProperty("app.email.outbox.otp-payload-secret"))
            .isEqualTo("${EMAIL_OTP_PAYLOAD_SECRET}");
    }

    @Test
    void developmentAndTestProfilesUsePostgreSqlFlywayAndHibernateValidation() throws Exception {
        PropertySource<?> dev = load("application-dev.yml");
        PropertySource<?> test = load("application-test.yml");

        assertPostgresProfile(dev, "${DEV_DB_URL:jdbc:postgresql://localhost:5432/seenly_dev}");
        assertThat(dev.getProperty("spring.datasource.username")).isEqualTo("${DEV_DB_USERNAME:seenly_dev}");
        assertThat(dev.getProperty("spring.datasource.password")).isEqualTo("${DEV_DB_PASSWORD:seenly_dev_password}");

        assertPostgresProfile(test, "${TEST_DB_URL:jdbc:postgresql://localhost:5432/seenly_test}");
        assertThat(test.getProperty("spring.datasource.username")).isEqualTo("${TEST_DB_USERNAME:seenly_test}");
        assertThat(test.getProperty("spring.datasource.password")).isEqualTo("${TEST_DB_PASSWORD:seenly_test_password}");
    }

    @Test
    void productionGuardRejectsMissingDatabaseNonPostgresDefaultsAndWildcardCors() {
        SecurityProperties security = new SecurityProperties();
        security.setAllowedOrigins(List.of("https://tensignal.example"));

        assertThatThrownBy(() -> guard(new MockEnvironment(), security).afterPropertiesSet())
            .hasMessageContaining("spring.datasource.url");

        MockEnvironment nonPostgres = validEnvironment();
        nonPostgres.setProperty("spring.datasource.url", "jdbc:mysql://db.internal/tensignal");
        assertThatThrownBy(() -> guard(nonPostgres, security).afterPropertiesSet())
            .hasMessageContaining("PostgreSQL");

        SecurityProperties wildcard = new SecurityProperties();
        wildcard.setAllowedOrigins(List.of("*"));
        assertThatThrownBy(() -> guard(validEnvironment(), wildcard).afterPropertiesSet())
            .hasMessageContaining("non-wildcard");
    }

    @Test
    void productionGuardAcceptsExplicitPostgresAndCorsConfiguration() throws Exception {
        SecurityProperties security = new SecurityProperties();
        security.setAllowedOrigins(List.of("https://tensignal.example"));
        guard(validEnvironment(), security).afterPropertiesSet();
    }

    @Test
    void productionGuardFailsFastWhenRequiredSmtpConfigurationIsMissing() {
        SecurityProperties security = new SecurityProperties();
        security.setAllowedOrigins(List.of("https://tensignal.example"));
        MockEnvironment environment = validEnvironment();
        environment.setProperty("app.email.provider", "smtp");
        environment.setProperty("spring.mail.host", "");
        assertThatThrownBy(() -> guard(environment, security).afterPropertiesSet())
            .hasMessageContaining("spring.mail.host");
    }

    @Test
    void productionGuardFailsFastWhenRequiredBrevoConfigurationIsMissing() {
        SecurityProperties security = new SecurityProperties();
        security.setAllowedOrigins(List.of("https://tensignal.example"));
        MockEnvironment environment = new MockEnvironment()
            .withProperty("spring.datasource.url", "jdbc:postgresql://db.internal/tensignal")
            .withProperty("spring.datasource.username", "tensignal_app")
            .withProperty("spring.datasource.password", "test-only-password")
            .withProperty("app.email.provider", "brevo")
            .withProperty("app.auth.mail-from", "mail@10signal.me")
            .withProperty("EMAIL_OTP_PAYLOAD_SECRET", "test-secret-that-is-at-least-32-characters-long")
            .withProperty("spring.jpa.hibernate.ddl-auto", "validate");

        assertThatThrownBy(() -> guard(environment, security).afterPropertiesSet())
            .hasMessageContaining("BREVO_API_KEY");
    }

    @Test
    void productionGuardAcceptsValidBrevoConfiguration() throws Exception {
        SecurityProperties security = new SecurityProperties();
        security.setAllowedOrigins(List.of("https://tensignal.example"));
        MockEnvironment environment = new MockEnvironment()
            .withProperty("spring.datasource.url", "jdbc:postgresql://db.internal/tensignal")
            .withProperty("spring.datasource.username", "tensignal_app")
            .withProperty("spring.datasource.password", "test-only-password")
            .withProperty("app.email.provider", "brevo")
            .withProperty("BREVO_API_KEY", "xkeysib-mock-test-key-for-contract")
            .withProperty("app.auth.mail-from", "mail@10signal.me")
            .withProperty("EMAIL_OTP_PAYLOAD_SECRET", "test-secret-that-is-at-least-32-characters-long")
            .withProperty("spring.jpa.hibernate.ddl-auto", "validate");

        guard(environment, security).afterPropertiesSet();
    }

    @Test
    void productionGuardRejectsDisabledEmailProvider() {
        SecurityProperties security = new SecurityProperties();
        security.setAllowedOrigins(List.of("https://tensignal.example"));
        MockEnvironment environment = new MockEnvironment()
            .withProperty("spring.datasource.url", "jdbc:postgresql://db.internal/tensignal")
            .withProperty("spring.datasource.username", "tensignal_app")
            .withProperty("spring.datasource.password", "test-only-password")
            .withProperty("app.email.provider", "disabled")
            .withProperty("app.auth.mail-from", "no-reply@tensignal.example")
            .withProperty("EMAIL_OTP_PAYLOAD_SECRET", "test-secret-that-is-at-least-32-characters-long")
            .withProperty("spring.jpa.hibernate.ddl-auto", "validate");

        assertThatThrownBy(() -> guard(environment, security).afterPropertiesSet())
            .hasMessageContaining("cannot be disabled");
    }

    @Test
    void productionGuardRejectsMissingOrInsecureOtpSecrets() {
        SecurityProperties security = new SecurityProperties();
        security.setAllowedOrigins(List.of("https://tensignal.example"));

        // 1. Missing secret
        MockEnvironment missing = validEnvironment();
        missing.setProperty("EMAIL_OTP_PAYLOAD_SECRET", "");
        missing.setProperty("app.email.outbox.otp-payload-secret", "");
        assertThatThrownBy(() -> guard(missing, security).afterPropertiesSet())
            .hasMessageContaining("EMAIL_OTP_PAYLOAD_SECRET");

        // 2. Default insecure secret
        MockEnvironment defaultSecret = validEnvironment();
        defaultSecret.setProperty("EMAIL_OTP_PAYLOAD_SECRET", "seenly-default-secure-otp-payload-key-256bit");
        assertThatThrownBy(() -> guard(defaultSecret, security).afterPropertiesSet())
            .hasMessageContaining("insecure default/placeholder");

        // 3. Placeholder secret
        MockEnvironment placeholderSecret = validEnvironment();
        placeholderSecret.setProperty("EMAIL_OTP_PAYLOAD_SECRET", "change-this-to-a-secure-256bit-secret-in-production");
        assertThatThrownBy(() -> guard(placeholderSecret, security).afterPropertiesSet())
            .hasMessageContaining("insecure default/placeholder");

        // 4. Short / weak secret (< 32 chars)
        MockEnvironment weakSecret = validEnvironment();
        weakSecret.setProperty("EMAIL_OTP_PAYLOAD_SECRET", "too-short-secret");
        assertThatThrownBy(() -> guard(weakSecret, security).afterPropertiesSet())
            .hasMessageContaining("at least 32 characters");

        // 5. Low-entropy repetitive secret (32+ chars, but low diversity)
        MockEnvironment lowEntropySecret = validEnvironment();
        lowEntropySecret.setProperty("EMAIL_OTP_PAYLOAD_SECRET", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        assertThatThrownBy(() -> guard(lowEntropySecret, security).afterPropertiesSet())
            .hasMessageContaining("character diversity");
    }

    @Test
    void paymentPropertiesDoesNotCrossFallbackBetweenDifferentCapacityPacks() {
        PaymentProperties properties = new PaymentProperties();
        properties.getLemonSqueezy().setCapacity50CheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/cap50");

        // CAPACITY_50 returns capacity50CheckoutUrl
        assertThat(properties.getLemonSqueezy().getCheckoutUrl(com.tensignal.backend.payment.PaymentProductCatalog.CAPACITY_50))
            .isEqualTo("https://10signal.lemonsqueezy.com/checkout/buy/cap50");

        // CAPACITY_100 is unconfigured and does not fall back to CAPACITY_50
        assertThat(properties.getLemonSqueezy().getCheckoutUrl(com.tensignal.backend.payment.PaymentProductCatalog.CAPACITY_100))
            .isEqualTo("");
    }

    @Test
    void productionGuardRejectsInsecureCorsOriginsAndWildcardProxyCidrs() {
        SecurityProperties localhostSecurity = new SecurityProperties();
        localhostSecurity.setAllowedOrigins(List.of("http://localhost:3000"));
        assertThatThrownBy(() -> guard(validEnvironment(), localhostSecurity).afterPropertiesSet())
            .hasMessageContaining("Development localhost origins are forbidden");

        SecurityProperties httpSecurity = new SecurityProperties();
        httpSecurity.setRequireHttps(true);
        httpSecurity.setAllowedOrigins(List.of("http://insecure.example.com"));
        assertThatThrownBy(() -> guard(validEnvironment(), httpSecurity).afterPropertiesSet())
            .hasMessageContaining("must use HTTPS");

        SecurityProperties wildcardProxy = new SecurityProperties();
        wildcardProxy.setAllowedOrigins(List.of("https://tensignal.example"));
        wildcardProxy.setTrustedProxyCidrs(List.of("0.0.0.0/0"));
        assertThatThrownBy(() -> guard(validEnvironment(), wildcardProxy).afterPropertiesSet())
            .hasMessageContaining("Overly permissive or wildcard trusted proxy CIDR");
    }

    @Test
    void productionRejectsTestProviderAndDefaultsPaymentsToDisabled() {
        PaymentProperties properties = new PaymentProperties();
        assertThat(properties.getProvider()).isEqualTo("disabled");
        properties.setProvider("test-hmac");
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("forbidden");
    }

    @Test
    void productionPaymentSafetyValidatesLemonSqueezyActiveProductsAndRejectsPlaceholders() {
        PaymentProperties properties = new PaymentProperties();
        properties.setProvider("lemonsqueezy");

        // Missing webhook secret
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("LEMON_SQUEEZY_WEBHOOK_SECRET");

        // Placeholder webhook secret
        properties.getLemonSqueezy().setWebhookSecret("<Lemon Squeezy Webhook Secret'ınız>");
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("cannot contain placeholder");

        properties.getLemonSqueezy().setWebhookSecret("valid-production-webhook-secret-value");

        // Missing Plus checkout URL
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("LEMON_SQUEEZY_PLUS_CHECKOUT_URL");

        // Non-https checkout URL
        properties.getLemonSqueezy().setPlusCheckoutUrl("http://insecure.lemonsqueezy.com/checkout/123");
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("must use HTTPS");

        // Legacy seenly domain
        properties.getLemonSqueezy().setPlusCheckoutUrl("https://seenly.lemonsqueezy.com/checkout/buy/123");
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("cannot use legacy seenly domain");

        // Valid Plus checkout URL
        properties.getLemonSqueezy().setPlusCheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/plus-uuid");

        // Missing Capacity 50
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("LEMON_SQUEEZY_CAPACITY_50_CHECKOUT_URL");

        properties.getLemonSqueezy().setCapacity50CheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/cap50-uuid");

        // Missing Capacity 150
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("LEMON_SQUEEZY_CAPACITY_150_CHECKOUT_URL");

        properties.getLemonSqueezy().setCapacity150CheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/cap150-uuid");

        // Missing Capacity 300
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("LEMON_SQUEEZY_CAPACITY_300_CHECKOUT_URL");

        properties.getLemonSqueezy().setCapacity300CheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/cap300-uuid");

        // Now completely valid: should not throw
        new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider();
    }

    @Test
    void productionPaymentSafetyEnforcesLiveProductionRules() {
        MockEnvironment prodEnv = new MockEnvironment();
        prodEnv.setActiveProfiles("prod");
        prodEnv.setProperty("DEPLOYMENT_ENVIRONMENT", "production");

        // 1. Payment provider disabled in production deployment is rejected
        PaymentProperties disabledProps = new PaymentProperties();
        disabledProps.setProvider("disabled");
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(disabledProps, prodEnv).rejectTestPaymentProvider())
            .hasMessageContaining("Payment provider cannot be disabled in production deployment");

        // 2. Unsupported payment provider in production deployment is rejected
        PaymentProperties stripeProps = new PaymentProperties();
        stripeProps.setProvider("stripe");
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(stripeProps, prodEnv).rejectTestPaymentProvider())
            .hasMessageContaining("Payment provider 'stripe' is not supported in production deployment");

        // 3. Lemon Squeezy with missing API key in production deployment is rejected
        PaymentProperties lsProps = new PaymentProperties();
        lsProps.setProvider("lemonsqueezy");
        lsProps.getLemonSqueezy().setWebhookSecret("valid-secret-123");
        lsProps.getLemonSqueezy().setPlusCheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/plus");
        lsProps.getLemonSqueezy().setCapacity50CheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/c50");
        lsProps.getLemonSqueezy().setCapacity150CheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/c150");
        lsProps.getLemonSqueezy().setCapacity300CheckoutUrl("https://10signal.lemonsqueezy.com/checkout/buy/c300");

        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(lsProps, prodEnv).rejectTestPaymentProvider())
            .hasMessageContaining("LEMON_SQUEEZY_API_KEY must be configured in production deployment");

        // 4. Lemon Squeezy with placeholder API key is rejected
        lsProps.getLemonSqueezy().setApiKey("your_lemon_squeezy_api_key_here");
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(lsProps, prodEnv).rejectTestPaymentProvider())
            .hasMessageContaining("LEMON_SQUEEZY_API_KEY cannot contain placeholder values");

        // 5. Lemon Squeezy with valid live API key succeeds in production deployment
        lsProps.getLemonSqueezy().setApiKey("live_ls_api_key_valid_string_xyz");
        new ProductionPaymentSafetyConfiguration(lsProps, prodEnv).rejectTestPaymentProvider();

        // 6. Test environment (non-production deployment) allows provider = disabled
        MockEnvironment testEnv = new MockEnvironment();
        testEnv.setActiveProfiles("prod");
        testEnv.setProperty("DEPLOYMENT_ENVIRONMENT", "test");
        new ProductionPaymentSafetyConfiguration(disabledProps, testEnv).rejectTestPaymentProvider();
    }

    @Test
    void profileSafetyValidatorEnforcesProductionRules() {
        // 1. Conflicting profiles (prod + dev)
        MockEnvironment conflicting = new MockEnvironment();
        conflicting.setActiveProfiles("prod", "dev");
        assertThatThrownBy(() -> com.tensignal.backend.config.ProfileSafetyValidator.validateProfiles(conflicting))
            .hasMessageContaining("Both 'prod' and 'dev'");

        // 2. Production environment indicator with dev profile
        MockEnvironment prodEnvWithDev = new MockEnvironment();
        prodEnvWithDev.setActiveProfiles("dev");
        prodEnvWithDev.setProperty("DEPLOYMENT_ENVIRONMENT", "production");
        assertThatThrownBy(() -> com.tensignal.backend.config.ProfileSafetyValidator.validateProfiles(prodEnvWithDev))
            .hasMessageContaining("production deployment environment indicator is set");

        // 3. Remote datasource configured with dev profile
        MockEnvironment prodDbWithDev = new MockEnvironment();
        prodDbWithDev.setActiveProfiles("dev");
        prodDbWithDev.setProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://prod-db:5432/tensignal");
        assertThatThrownBy(() -> com.tensignal.backend.config.ProfileSafetyValidator.validateProfiles(prodDbWithDev))
            .hasMessageContaining("remote database");

        // 4. Local datasource override with dev profile (passes cleanly)
        MockEnvironment localDbWithDev = new MockEnvironment();
        localDbWithDev.setActiveProfiles("dev");
        localDbWithDev.setProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://localhost:5432/seenly_dev");
        com.tensignal.backend.config.ProfileSafetyValidator.validateProfiles(localDbWithDev);

        // 5. Valid dev environment (passes cleanly)
        MockEnvironment validDev = new MockEnvironment();
        validDev.setActiveProfiles("dev");
        com.tensignal.backend.config.ProfileSafetyValidator.validateProfiles(validDev);

        // 6. Valid prod environment (passes cleanly)
        MockEnvironment validProd = new MockEnvironment();
        validProd.setActiveProfiles("prod");
        validProd.setProperty("DEPLOYMENT_ENVIRONMENT", "production");
        com.tensignal.backend.config.ProfileSafetyValidator.validateProfiles(validProd);
    }

    private MockEnvironment validEnvironment() {
        return new MockEnvironment()
            .withProperty("spring.datasource.url", "jdbc:postgresql://db.internal/tensignal")
            .withProperty("spring.datasource.username", "tensignal_app")
            .withProperty("spring.datasource.password", "test-only-password")
            .withProperty("spring.mail.host", "smtp.internal")
            .withProperty("spring.mail.username", "tensignal-mailer")
            .withProperty("spring.mail.password", "test-only-mail-password")
            .withProperty("app.auth.mail-from", "no-reply@tensignal.example")
            .withProperty("EMAIL_OTP_PAYLOAD_SECRET", "test-secret-that-is-at-least-32-characters-long")
            .withProperty("spring.jpa.hibernate.ddl-auto", "validate");
    }

    private InitializingBean guard(MockEnvironment environment, SecurityProperties security) {
        return new ProductionSafetyConfiguration().validateProductionConfiguration(environment, security);
    }

    private PropertySource<?> load(String name) throws Exception {
        return new YamlPropertySourceLoader().load(name, new ClassPathResource(name)).get(0);
    }

    private void assertPostgresProfile(PropertySource<?> source, String expectedUrl) {
        assertThat(source.getProperty("spring.datasource.url")).isEqualTo(expectedUrl);
        assertThat(source.getProperty("spring.datasource.driver-class-name")).isEqualTo("org.postgresql.Driver");
        assertThat(source.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(source.getProperty("spring.flyway.enabled")).isEqualTo(true);
        assertThat(source.getProperty("spring.flyway.clean-disabled")).isEqualTo(true);
    }
}
