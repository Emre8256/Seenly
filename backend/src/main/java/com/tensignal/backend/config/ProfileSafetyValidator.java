package com.tensignal.backend.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Validates that production environments are not accidentally booted with the development profile,
 * and ensures conflicting profile combinations (e.g. prod + dev) fail fast on startup.
 */
@Component
public class ProfileSafetyValidator implements InitializingBean {

    private final Environment environment;

    public ProfileSafetyValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void afterPropertiesSet() {
        validateProfiles(this.environment);
    }

    public static void validateProfiles(Environment env) {
        List<String> activeProfiles = Arrays.asList(env.getActiveProfiles());
        boolean isProd = activeProfiles.contains("prod");
        boolean isDev = activeProfiles.contains("dev");

        // Conflicting profiles check
        if (isProd && isDev) {
            throw new IllegalStateException(
                "CRITICAL MISCONFIGURATION: Both 'prod' and 'dev' Spring profiles are active simultaneously. " +
                "Conflicting profile activation is strictly forbidden."
            );
        }

        // Production environment indicator detection
        String deployEnv = env.getProperty("DEPLOYMENT_ENVIRONMENT");
        if (deployEnv == null || deployEnv.isBlank()) {
            deployEnv = env.getProperty("ENVIRONMENT");
        }
        if (deployEnv == null || deployEnv.isBlank()) {
            deployEnv = env.getProperty("APP_ENV");
        }
        boolean isProductionEnv = deployEnv != null &&
            ("production".equalsIgnoreCase(deployEnv.trim()) || "prod".equalsIgnoreCase(deployEnv.trim()));

        String datasourceUrl = env.getProperty("SPRING_DATASOURCE_URL");
        boolean isRemoteDatasource = datasourceUrl != null && !datasourceUrl.isBlank()
            && !datasourceUrl.contains("localhost")
            && !datasourceUrl.contains("127.0.0.1")
            && !datasourceUrl.contains("host.docker.internal");

        if (isProductionEnv && !isProd) {
            throw new IllegalStateException(
                "CRITICAL MISCONFIGURATION: production deployment environment indicator is set (" + deployEnv + "), " +
                "but the active Spring profile is not 'prod' (active profiles: " + activeProfiles + "). " +
                "Booting a production environment with the insecure 'dev' profile is strictly forbidden."
            );
        }

        if (isRemoteDatasource && isDev && !isProd) {
            throw new IllegalStateException(
                "CRITICAL MISCONFIGURATION: A remote database (SPRING_DATASOURCE_URL) is configured while the 'dev' " +
                "profile is active. Connecting to remote/production databases under 'dev' profile is strictly forbidden."
            );
        }
    }
}
