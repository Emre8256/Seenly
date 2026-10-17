package com.tensignal.backend.config;

import org.apache.commons.logging.Log;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Automatically loads key-value properties from a local .env file (if present)
 * into the Spring Environment, enabling local developers to copy .env.example
 * to .env without requiring IDE plugins or shell exports.
 *
 * Runs BEFORE ConfigDataEnvironmentPostProcessor so that placeholders in
 * application.yml (such as ${EMAIL_PROVIDER:disabled}) resolve against .env values.
 *
 * Registered in META-INF/spring.factories for Spring Boot 3.x EnvironmentPostProcessor discovery.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    public static final int ORDER = ConfigDataEnvironmentPostProcessor.ORDER - 1;

    private final Log log;

    public DotenvEnvironmentPostProcessor() {
        this.log = null;
    }

    public DotenvEnvironmentPostProcessor(DeferredLogFactory logFactory) {
        this.log = logFactory != null ? logFactory.getLog(DotenvEnvironmentPostProcessor.class) : null;
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        File envFile = findDotenvFile();
        if (envFile == null || !envFile.exists() || !envFile.isFile()) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(envFile.toPath(), StandardCharsets.UTF_8);
            Map<String, Object> props = new HashMap<>();

            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                int eqIdx = trimmed.indexOf('=');
                if (eqIdx <= 0) {
                    continue;
                }
                String key = trimmed.substring(0, eqIdx).trim();
                String value = trimmed.substring(eqIdx + 1).trim();

                // Strip UTF-8 BOM if present on the first key
                if (key.startsWith("\uFEFF")) {
                    key = key.substring(1).trim();
                }

                // Strip outer double or single quotes
                if ((value.startsWith("\"") && value.endsWith("\""))
                    || (value.startsWith("'") && value.endsWith("'"))) {
                    if (value.length() >= 2) {
                        value = value.substring(1, value.length() - 1);
                    }
                }

                if (!key.isEmpty()) {
                    props.put(key, value);
                }
            }

            if (!props.isEmpty()) {
                MapPropertySource source = new MapPropertySource("dotenvProperties", props);
                if (environment.getPropertySources().contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
                    environment.getPropertySources().addAfter(
                        StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
                        source
                    );
                } else {
                    environment.getPropertySources().addLast(source);
                }

                if (log != null) {
                    log.info("Dotenv: loaded properties from " + envFile.getAbsolutePath() + " (keys: " + props.keySet() + ")");
                }
            }
        } catch (IOException ignored) {
            // Gracefully ignore unreadable .env file
        }
    }

    private File findDotenvFile() {
        String explicitPath = System.getProperty("dotenv.file");
        if (explicitPath != null && !explicitPath.isBlank()) {
            File f = new File(explicitPath);
            return (f.exists() && f.isFile()) ? f : null;
        }

        // 1. Current working directory .env
        File f1 = new File(".env");
        if (f1.exists() && f1.isFile()) {
            return f1;
        }

        // 2. backend/.env (when running from project root)
        File f2 = new File("backend/.env");
        if (f2.exists() && f2.isFile()) {
            return f2;
        }

        // 3. Parent directory ../.env
        File f3 = new File("../.env");
        if (f3.exists() && f3.isFile()) {
            return f3;
        }

        return null;
    }

    @Override
    public int getOrder() {
        return ORDER;
    }
}
