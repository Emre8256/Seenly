package com.seenly.backend;

import com.seenly.backend.config.ProductionSafetyConfiguration;
import com.seenly.backend.config.SecurityProperties;
import com.seenly.backend.config.PaymentProperties;
import com.seenly.backend.config.ProductionPaymentSafetyConfiguration;
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
        security.setAllowedOrigins(List.of("https://seenly.example"));

        assertThatThrownBy(() -> guard(new MockEnvironment(), security).afterPropertiesSet())
            .hasMessageContaining("spring.datasource.url");

        MockEnvironment nonPostgres = validEnvironment();
        nonPostgres.setProperty("spring.datasource.url", "jdbc:mysql://db.internal/seenly");
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
        security.setAllowedOrigins(List.of("https://seenly.example"));
        guard(validEnvironment(), security).afterPropertiesSet();
    }

    @Test
    void productionGuardFailsFastWhenRequiredSmtpConfigurationIsMissing() {
        SecurityProperties security = new SecurityProperties();
        security.setAllowedOrigins(List.of("https://seenly.example"));
        MockEnvironment environment = validEnvironment();
        environment.setProperty("spring.mail.host", "");
        assertThatThrownBy(() -> guard(environment, security).afterPropertiesSet())
            .hasMessageContaining("spring.mail.host");
    }

    @Test
    void productionRejectsTestProviderAndDefaultsPaymentsToDisabled() {
        PaymentProperties properties = new PaymentProperties();
        assertThat(properties.getProvider()).isEqualTo("disabled");
        properties.setProvider("test-hmac");
        assertThatThrownBy(() -> new ProductionPaymentSafetyConfiguration(properties).rejectTestPaymentProvider())
            .hasMessageContaining("forbidden");
    }

    private MockEnvironment validEnvironment() {
        return new MockEnvironment()
            .withProperty("spring.datasource.url", "jdbc:postgresql://db.internal/seenly")
            .withProperty("spring.datasource.username", "seenly_app")
            .withProperty("spring.datasource.password", "test-only-password")
            .withProperty("spring.mail.host", "smtp.internal")
            .withProperty("spring.mail.username", "seenly-mailer")
            .withProperty("spring.mail.password", "test-only-mail-password")
            .withProperty("app.auth.mail-from", "no-reply@seenly.example")
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
