package com.tensignal.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.config.SecurityHeadersFilter;
import com.tensignal.backend.config.SecurityProperties;
import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.dto.CreateTenSignalRequest;
import com.tensignal.backend.entity.SelfAnswer;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.repository.RateLimitBucketRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.service.AbuseSignalService;
import com.tensignal.backend.service.ClientIpResolver;
import com.tensignal.backend.service.OwnerSessionService;
import com.tensignal.backend.service.RateLimitService;
import com.tensignal.backend.service.ScoringEngineService;
import com.tensignal.backend.service.TokenHashingService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class SecurityHardeningIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired TenSignalRepository tenSignalRepository;
    @Autowired TokenHashingService tokenHashingService;
    @Autowired ScoringEngineService scoringEngineService;
    @Autowired OwnerSessionService ownerSessionService;
    @Autowired RateLimitService rateLimitService;
    @Autowired AbuseSignalService abuseSignalService;
    @Autowired RateLimitBucketRepository rateLimitBucketRepository;
    @Autowired EntityManager entityManager;

    @Test
    void invalidOwnerTokensAreRejectedAndDevBypassIsImpossible() throws Exception {
        // 1. Missing header
        mockMvc.perform(get("/api/v1/tensignal/owner"))
            .andExpect(status().isUnauthorized());

        // 2. Empty header
        mockMvc.perform(get("/api/v1/tensignal/owner").header("X-Owner-Token", ""))
            .andExpect(status().isUnauthorized());

        // 3. Whitespace header
        mockMvc.perform(get("/api/v1/tensignal/owner").header("X-Owner-Token", "   "))
            .andExpect(status().isUnauthorized());

        // 4. Random invalid token
        mockMvc.perform(get("/api/v1/tensignal/owner").header("X-Owner-Token", "invalid-random-token-12345"))
            .andExpect(status().isUnauthorized());

        // 5. Former dev bypass slug 'i8XR9QV2' must be rejected even if a profile exists
        ProfileFixture devProfile = createProfile("Dev Bypass Target", "bypass-target@example.com", "i8XR9QV2");
        mockMvc.perform(get("/api/v1/tensignal/owner").header("X-Owner-Token", "i8XR9QV2"))
            .andExpect(status().isUnauthorized());

        // 6. Valid token works for the owner
        mockMvc.perform(get("/api/v1/tensignal/owner").header("X-Owner-Token", devProfile.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.displayName").value("Dev Bypass Target"));
    }

    @Test
    void crossUserDataIsolationIsStrictlyEnforced() throws Exception {
        ProfileFixture userA = createProfile("User A", "user-a@example.com", null);
        ProfileFixture userB = createProfile("User B", "user-b@example.com", null);

        // User A reads their own profile
        mockMvc.perform(get("/api/v1/tensignal/owner").header("X-Owner-Token", userA.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.displayName").value("User A"))
            .andExpect(jsonPath("$.email").value("user-a@example.com"))
            .andExpect(jsonPath("$.publicSlug").value(userA.publicSlug()));

        // User B reads their own profile
        mockMvc.perform(get("/api/v1/tensignal/owner").header("X-Owner-Token", userB.ownerToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.displayName").value("User B"))
            .andExpect(jsonPath("$.email").value("user-b@example.com"))
            .andExpect(jsonPath("$.publicSlug").value(userB.publicSlug()));

        // User A updates avatar: only User A is modified
        mockMvc.perform(put("/api/v1/tensignal/owner/avatar")
                .header("X-Owner-Token", userA.ownerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"avatar\":\"kadin2\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.avatar").value("kadin2"));

        entityManager.flush();
        entityManager.clear();

        TenSignal refreshedB = tenSignalRepository.findByPublicSlug(userB.publicSlug()).orElseThrow();
        assertThat(refreshedB.getAvatar()).isNotEqualTo("kadin2");

        // User A deletes account: User A is removed, User B remains
        mockMvc.perform(delete("/api/billing/delete-account")
                .header("X-Owner-Token", userA.ownerToken()))
            .andExpect(status().isOk());

        entityManager.flush();
        entityManager.clear();

        assertThat(tenSignalRepository.findByPublicSlug(userA.publicSlug())).isEmpty();
        assertThat(tenSignalRepository.findByPublicSlug(userB.publicSlug())).isPresent();
    }

    @Test
    void forwardedHeaderSpoofingProtectionRejectsUntrustedPeers() {
        SecurityProperties properties = new SecurityProperties();
        properties.setTrustedProxyCidrs(List.of("10.0.0.0/8"));
        ClientIpResolver resolver = new ClientIpResolver(properties);

        // 1. Untrusted client tries to spoof X-Forwarded-For and X-Forwarded-Proto
        MockHttpServletRequest untrusted = new MockHttpServletRequest();
        untrusted.setRemoteAddr("198.51.100.77");
        untrusted.addHeader("X-Forwarded-For", "203.0.113.10");
        untrusted.addHeader("X-Forwarded-Proto", "https");

        assertThat(resolver.resolve(untrusted)).isEqualTo("198.51.100.77");
        assertThat(resolver.isSecure(untrusted)).isFalse();

        // 2. Trusted proxy delivers real client IP and HTTPS indication
        MockHttpServletRequest trusted = new MockHttpServletRequest();
        trusted.setRemoteAddr("10.0.2.15");
        trusted.addHeader("X-Forwarded-For", "203.0.113.10");
        trusted.addHeader("X-Forwarded-Proto", "https");

        assertThat(resolver.resolve(trusted)).isEqualTo("203.0.113.10");
        assertThat(resolver.isSecure(trusted)).isTrue();

        // 3. Trusted proxy chain with multiple hops walks only trusted tail
        MockHttpServletRequest multiHop = new MockHttpServletRequest();
        multiHop.setRemoteAddr("10.0.2.15");
        multiHop.addHeader("X-Forwarded-For", "198.51.100.1, 10.0.1.99");
        multiHop.addHeader("X-Forwarded-Proto", "https");

        assertThat(resolver.resolve(multiHop)).isEqualTo("198.51.100.1");
        assertThat(resolver.isSecure(multiHop)).isTrue();
    }

    @Test
    void securityHeadersFilterEnforcesHttpsWhenConfigured() throws Exception {
        SecurityProperties properties = new SecurityProperties();
        properties.setRequireHttps(true);
        properties.setSecureHeaders(true);
        properties.setTrustedProxyCidrs(List.of("10.0.0.0/8"));

        ClientIpResolver resolver = new ClientIpResolver(properties);
        SecurityHeadersFilter filter = new SecurityHeadersFilter(properties, resolver);

        // Case A: Direct insecure HTTP to API endpoint -> Rejected with HTTP 426
        MockHttpServletRequest directHttp = new MockHttpServletRequest("GET", "/api/v1/tensignal/owner");
        directHttp.setRemoteAddr("198.51.100.50");
        directHttp.setSecure(false);
        MockHttpServletResponse responseA = new MockHttpServletResponse();
        MockFilterChain chainA = new MockFilterChain();

        filter.doFilter(directHttp, responseA, chainA);
        assertThat(responseA.getStatus()).isEqualTo(426);
        assertThat(chainA.getRequest()).isNull();

        // Case B: Untrusted peer spoofing X-Forwarded-Proto: https -> Still rejected with 426
        MockHttpServletRequest spoofedHttp = new MockHttpServletRequest("GET", "/api/v1/tensignal/owner");
        spoofedHttp.setRemoteAddr("198.51.100.50");
        spoofedHttp.addHeader("X-Forwarded-Proto", "https");
        spoofedHttp.setSecure(false);
        MockHttpServletResponse responseB = new MockHttpServletResponse();
        MockFilterChain chainB = new MockFilterChain();

        filter.doFilter(spoofedHttp, responseB, chainB);
        assertThat(responseB.getStatus()).isEqualTo(426);

        // Case C: Health check is allowed over HTTP (for container probes)
        MockHttpServletRequest healthProbe = new MockHttpServletRequest("GET", "/actuator/health/liveness");
        healthProbe.setRemoteAddr("10.0.0.1");
        healthProbe.setSecure(false);
        MockHttpServletResponse responseC = new MockHttpServletResponse();
        MockFilterChain chainC = new MockFilterChain();

        filter.doFilter(healthProbe, responseC, chainC);
        assertThat(responseC.getStatus()).isEqualTo(200);
        assertThat(chainC.getRequest()).isNotNull();

        // Case D: Trusted proxy with HTTPS -> Allowed with HSTS and security headers
        MockHttpServletRequest trustedHttps = new MockHttpServletRequest("GET", "/api/v1/tensignal/owner");
        trustedHttps.setRemoteAddr("10.0.0.2");
        trustedHttps.addHeader("X-Forwarded-Proto", "https");
        trustedHttps.setSecure(false);
        MockHttpServletResponse responseD = new MockHttpServletResponse();
        MockFilterChain chainD = new MockFilterChain();

        filter.doFilter(trustedHttps, responseD, chainD);
        assertThat(responseD.getStatus()).isEqualTo(200);
        assertThat(responseD.getHeader("Strict-Transport-Security")).contains("max-age=31536000");
        assertThat(responseD.getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(responseD.getHeader("X-Frame-Options")).isEqualTo("DENY");
        assertThat(responseD.getHeader("Content-Security-Policy")).isEqualTo("default-src 'none'; frame-ancestors 'none'");
    }

    @Test
    void rateLimiterUsesResolvedClientIpRatherThanProxyIp() {
        SecurityProperties properties = new SecurityProperties();
        properties.setTrustedProxyCidrs(List.of("10.0.0.0/8"));
        ClientIpResolver resolver = new ClientIpResolver(properties);

        // Two different clients arriving through the same trusted proxy
        MockHttpServletRequest client1 = new MockHttpServletRequest();
        client1.setRemoteAddr("10.0.0.1");
        client1.addHeader("X-Forwarded-For", "203.0.113.1");

        MockHttpServletRequest client2 = new MockHttpServletRequest();
        client2.setRemoteAddr("10.0.0.1");
        client2.addHeader("X-Forwarded-For", "203.0.113.2");

        String resolved1 = resolver.resolve(client1);
        String resolved2 = resolver.resolve(client2);

        assertThat(resolved1).isEqualTo("203.0.113.1");
        assertThat(resolved2).isEqualTo("203.0.113.2");

        // Verify RateLimitService assigns separate buckets
        String subject1 = abuseSignalService.networkHash(resolved1);
        String subject2 = abuseSignalService.networkHash(resolved2);

        assertThat(subject1).isNotEqualTo(subject2);

        // Exhaust client1's rate limit
        for (int i = 0; i < 3; i++) {
            rateLimitService.check("TEST_ACTION", subject1, 3, Duration.ofMinutes(1));
        }

        // client2 is NOT affected by client1's exhaustion despite same proxy IP
        rateLimitService.check("TEST_ACTION", subject2, 3, Duration.ofMinutes(1));
    }

    @Test
    void corsAndActuatorEndpointsAreRestricted() throws Exception {
        // Allowed Origin passes
        mockMvc.perform(options("/api/v1/rarity/all")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));

        // Unauthorized Origin rejected
        mockMvc.perform(options("/api/v1/rarity/all")
                .header("Origin", "https://unauthorized-attacker.example")
                .header("Access-Control-Request-Method", "GET"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));

        // Sensitive Actuator endpoints return 404
        mockMvc.perform(get("/actuator/env")).andExpect(status().isNotFound());
        mockMvc.perform(get("/actuator/beans")).andExpect(status().isNotFound());
        mockMvc.perform(get("/actuator/heapdump")).andExpect(status().isNotFound());
        mockMvc.perform(get("/actuator/shutdown")).andExpect(status().isNotFound());
    }

    private ProfileFixture createProfile(String displayName, String email, String explicitSlug) {
        List<CreateTenSignalRequest.SelfAnswerInput> answers = new ArrayList<>();
        for (String lens : AppConstants.LENSES) {
            answers.add(new CreateTenSignalRequest.SelfAnswerInput("classic_self_" + lens + "_01", 3));
        }
        String rawToken = tokenHashingService.generateRawToken();
        String slug = explicitSlug != null ? explicitSlug : tokenHashingService.generatePublicSlug();
        TenSignal tenSignal = TenSignal.builder()
            .displayName(displayName)
            .email(email)
            .publicSlug(slug)
            .ownerTokenHash(tokenHashingService.hashToken(rawToken))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600))
            .build();
        tenSignal.setSelfAnswers(answers.stream().map(answer -> SelfAnswer.builder()
            .seenly(tenSignal)
            .questionId(answer.getQuestionId())
            .answerValue(answer.getAnswerValue())
            .build()).toList());
        tenSignalRepository.saveAndFlush(tenSignal);
        tenSignal.setResultSnapshot(scoringEngineService.calculateSelfResult(tenSignal));
        entityManager.flush();
        entityManager.clear();
        return new ProfileFixture(rawToken, tenSignal.getPublicSlug());
    }

    private record ProfileFixture(String ownerToken, String publicSlug) {
    }
}
