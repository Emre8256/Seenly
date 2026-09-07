package com.seenly.backend;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Arrays;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("prod")
@Testcontainers(disabledWithoutDocker = true)
class PostgreSqlMigrationIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16.4-alpine")
        .withDatabaseName("seenly_test")
        .withUsername("seenly_test")
        .withPassword("test-only-password");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", () -> "1025");
        registry.add("spring.mail.username", () -> "test");
        registry.add("spring.mail.password", () -> "test-only-password");
        registry.add("app.auth.mail-from", () -> "no-reply@seenly.test");
        registry.add("app.security.allowed-origins", () -> "https://seenly.test");
    }

    @Autowired Flyway flyway;
    @Autowired JdbcTemplate jdbc;

    @Test
    void emptyPostgresMigratesInOrderAndHibernateValidatesTheResult() {
        MigrationInfo[] applied = flyway.info().applied();
        assertThat(Arrays.stream(applied).map(info -> info.getVersion().toString()).toList())
            .containsExactly("1", "2", "3", "4");
        assertThat(flyway.validateWithResult().validationSuccessful).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history", Integer.class)).isEqualTo(4);
        assertThat(jdbc.queryForObject("select count(*) from rate_limit_buckets", Integer.class)).isZero();
    }

    @Test
    void legacyDuplicateMigrationFailsWithoutDeletingResponses() {
        String schema = "legacy_duplicate";
        jdbc.execute("create schema " + schema);
        jdbc.execute("create table " + schema + ".users (id uuid primary key)");
        jdbc.execute("create table " + schema + ".seenlys (id uuid primary key)");
        jdbc.execute("create table " + schema + ".response_sessions (id uuid primary key, seenly_id uuid not null, fingerprint_hash varchar(255), ip_address varchar(255))");
        UUID target = UUID.randomUUID();
        jdbc.update("insert into " + schema + ".seenlys(id) values (?)", target);
        jdbc.update("insert into " + schema + ".response_sessions(id, seenly_id, fingerprint_hash, ip_address) values (?, ?, ?, ?)",
            UUID.randomUUID(), target, "same raw signal", "198.51.100.1");
        jdbc.update("insert into " + schema + ".response_sessions(id, seenly_id, fingerprint_hash, ip_address) values (?, ?, ?, ?)",
            UUID.randomUUID(), target, "same raw signal", "198.51.100.1");

        Flyway legacy = Flyway.configure()
            .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .schemas(schema)
            .locations("classpath:db/migration")
            .baselineOnMigrate(true)
            .baselineVersion("1")
            .load();

        assertThatThrownBy(legacy::migrate).hasStackTraceContaining("duplicate target/fingerprint");
        assertThat(jdbc.queryForObject("select count(*) from " + schema + ".response_sessions", Integer.class))
            .isEqualTo(2);
    }
}
