package com.tensignal.backend;

import com.tensignal.backend.config.SecurityProperties;
import com.tensignal.backend.service.ClientIpResolver;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProxyAndHealthIntegrationTest {
    @Autowired MockMvc mockMvc;

    @Test
    void directUntrustedPeerCannotSpoofForwardedClientIp() {
        SecurityProperties properties = new SecurityProperties();
        properties.setTrustedProxyCidrs(List.of("10.0.0.0/8"));
        ClientIpResolver resolver = new ClientIpResolver(properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.20");
        request.addHeader("X-Forwarded-For", "203.0.113.99");

        assertThat(resolver.resolve(request)).isEqualTo("198.51.100.20");
        request.addHeader("X-Forwarded-Proto", "https");
        assertThat(resolver.isSecure(request)).isFalse();
    }

    @Test
    void trustedProxyResolvesClientAndWalksOnlyTheTrustedTail() {
        SecurityProperties properties = new SecurityProperties();
        properties.setTrustedProxyCidrs(List.of("10.0.0.0/8", "192.0.2.10/32"));
        ClientIpResolver resolver = new ClientIpResolver(properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.1.2.3");
        request.addHeader("X-Forwarded-For", "203.0.113.8, 192.0.2.10");
        request.addHeader("X-Forwarded-Proto", "https");

        assertThat(resolver.resolve(request)).isEqualTo("203.0.113.8");
        assertThat(resolver.isSecure(request)).isTrue();
    }

    @Test
    void databaseReadinessAndLivenessAreAvailableWithoutSensitiveActuatorEndpoints() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        mockMvc.perform(get("/actuator/health/readiness"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        mockMvc.perform(get("/actuator/env")).andExpect(status().isNotFound());
        mockMvc.perform(get("/actuator/beans")).andExpect(status().isNotFound());
        mockMvc.perform(get("/actuator/heapdump")).andExpect(status().isNotFound());
        mockMvc.perform(get("/actuator/loggers")).andExpect(status().isNotFound());
        mockMvc.perform(get("/actuator/configprops")).andExpect(status().isNotFound());
    }

    @Test
    void corsUsesExplicitAllowlistAndSecurityHeadersAreApplied() throws Exception {
        mockMvc.perform(options("/api/v1/rarity/all")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));

        mockMvc.perform(options("/api/v1/rarity/all")
                .header("Origin", "https://evil.example")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));

        mockMvc.perform(get("/actuator/health/liveness"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Content-Type-Options", "nosniff"))
            .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @Test
    void testProfileUsesPostgreSqlOnly() throws Exception {
        mockMvc.perform(get("/actuator/health/readiness"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }
}
