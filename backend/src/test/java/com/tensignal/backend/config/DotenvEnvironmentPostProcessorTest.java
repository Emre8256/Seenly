package com.tensignal.backend.config;

import com.tensignal.backend.email.EmailSender;
import com.tensignal.backend.email.BrevoEmailProvider;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.support.SpringFactoriesLoader;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DotenvEnvironmentPostProcessorTest {

    @Test
    void testDiscoveredBySpringFactoriesLoader() {
        List<String> factoryNames = SpringFactoriesLoader.loadFactoryNames(
            EnvironmentPostProcessor.class,
            getClass().getClassLoader()
        );
        assertThat(factoryNames)
            .isNotEmpty()
            .contains(DotenvEnvironmentPostProcessor.class.getName());
    }

    @Test
    void testPostProcessorLoadsDotenvWhenPresent() throws Exception {
        File tempEnv = File.createTempFile(".env-test", ".tmp");
        tempEnv.deleteOnExit();

        Files.writeString(tempEnv.toPath(),
            "# Comment line\n" +
            "EMAIL_PROVIDER=brevo\n" +
            "BREVO_API_KEY=\"xkeysib-mock-test-key\"\n" +
            "AUTH_MAIL_FROM='mail@10signal.me'\n" +
            "\n" +
            "EMPTY_VAL=\n",
            StandardCharsets.UTF_8
        );

        String previousExplicit = System.getProperty("dotenv.file");
        try {
            System.setProperty("dotenv.file", tempEnv.getAbsolutePath());

            DotenvEnvironmentPostProcessor processor = new DotenvEnvironmentPostProcessor();
            StandardEnvironment environment = new StandardEnvironment();
            processor.postProcessEnvironment(environment, null);

            assertThat(environment.getProperty("EMAIL_PROVIDER")).isEqualTo("brevo");
            assertThat(environment.getProperty("BREVO_API_KEY")).isEqualTo("xkeysib-mock-test-key");
            assertThat(environment.getProperty("AUTH_MAIL_FROM")).isEqualTo("mail@10signal.me");
        } finally {
            if (previousExplicit != null) {
                System.setProperty("dotenv.file", previousExplicit);
            } else {
                System.clearProperty("dotenv.file");
            }
        }
    }

    @Test
    void testPostProcessorGracefulWhenFileMissing() {
        String previousExplicit = System.getProperty("dotenv.file");
        try {
            System.setProperty("dotenv.file", "non_existent_file_path_12345.env");

            DotenvEnvironmentPostProcessor processor = new DotenvEnvironmentPostProcessor();
            StandardEnvironment environment = new StandardEnvironment();

            processor.postProcessEnvironment(environment, null);
            assertThat(environment.getPropertySources().contains("dotenvProperties")).isFalse();
        } finally {
            if (previousExplicit != null) {
                System.setProperty("dotenv.file", previousExplicit);
            } else {
                System.clearProperty("dotenv.file");
            }
        }
    }

    @Test
    void testEndToEndDotenvDiscoveredAndSelectsBrevoProvider() throws Exception {
        File tempEnv = File.createTempFile(".env-e2e", ".tmp");
        tempEnv.deleteOnExit();

        Files.writeString(tempEnv.toPath(),
            "EMAIL_PROVIDER=brevo\n" +
            "BREVO_API_KEY=xkeysib-sample-valid-test-key\n" +
            "AUTH_MAIL_FROM=mail@10signal.me\n",
            StandardCharsets.UTF_8
        );

        String previousExplicit = System.getProperty("dotenv.file");
        try {
            System.setProperty("dotenv.file", tempEnv.getAbsolutePath());

            // Launch a minimal Spring Boot context that uses SpringFactoriesLoader (so EnvironmentPostProcessor is triggered)
            try (ConfigurableApplicationContext context = new SpringApplicationBuilder(
                    com.tensignal.backend.email.EmailProviderConfiguration.class,
                    com.fasterxml.jackson.databind.ObjectMapper.class)
                    .web(org.springframework.boot.WebApplicationType.NONE)
                    .properties("spring.main.banner-mode=off")
                    .run()) {

                EmailSender sender = context.getBean(EmailSender.class);
                assertThat(sender).isInstanceOf(BrevoEmailProvider.class);
                assertThat(sender.getProviderId()).isEqualTo("brevo");
                assertThat(context.getEnvironment().getProperty("EMAIL_PROVIDER")).isEqualTo("brevo");
                assertThat(context.getEnvironment().getProperty("AUTH_MAIL_FROM")).isEqualTo("mail@10signal.me");
            }
        } finally {
            if (previousExplicit != null) {
                System.setProperty("dotenv.file", previousExplicit);
            } else {
                System.clearProperty("dotenv.file");
            }
        }
    }
}
