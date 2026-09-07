package com.seenly.backend.config;

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
            required(environment, "spring.mail.host");
            required(environment, "spring.mail.username");
            required(environment, "spring.mail.password");
            required(environment, "app.auth.mail-from");
            if (!url.toLowerCase(Locale.ROOT).startsWith("jdbc:postgresql:")) {
                throw new IllegalStateException("Production datasource must use PostgreSQL.");
            }
            if ("postgres".equalsIgnoreCase(username) && "postgres".equals(password)) {
                throw new IllegalStateException("Default postgres/postgres credentials are forbidden in production.");
            }
            if (!"validate".equalsIgnoreCase(environment.getProperty("spring.jpa.hibernate.ddl-auto"))) {
                throw new IllegalStateException("Production Hibernate ddl-auto must be validate.");
            }
            if (security.getAllowedOrigins().isEmpty()
                    || security.getAllowedOrigins().stream().anyMatch(origin -> origin.contains("*"))) {
                throw new IllegalStateException("Production CORS origins must be an explicit non-wildcard allowlist.");
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
