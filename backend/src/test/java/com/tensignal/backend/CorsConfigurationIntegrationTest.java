package com.tensignal.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.security.allowed-origins=https://10signal.me,https://www.10signal.me",
    "app.security.require-https=false"
})
public class CorsConfigurationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void allowsParticipantSignalPreflightFromProductionOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/tensignal/public/AbCd1234")
                .header("Origin", "https://10signal.me")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Participant-Signal"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "https://10signal.me"))
            .andExpect(header().string("Access-Control-Allow-Methods", containsString("GET")))
            .andExpect(header().string("Access-Control-Allow-Headers", containsString("X-Participant-Signal")));
    }

    @Test
    void allowsCurrencyPreflightFromProductionOrigin() throws Exception {
        mockMvc.perform(options("/api/billing/products")
                .header("Origin", "https://10signal.me")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Currency"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "https://10signal.me"))
            .andExpect(header().string("Access-Control-Allow-Headers", containsString("X-Currency")));
    }

    @Test
    void allowsOwnerTokenPreflightFromProductionOrigin() throws Exception {
        mockMvc.perform(options("/api/v1/tensignal/owner")
                .header("Origin", "https://10signal.me")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Owner-Token"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "https://10signal.me"))
            .andExpect(header().string("Access-Control-Allow-Headers", containsString("X-Owner-Token")));
    }

    @Test
    void allowsWwwOriginWhenConfiguredInAllowedOrigins() throws Exception {
        mockMvc.perform(options("/api/v1/tensignal/owner")
                .header("Origin", "https://www.10signal.me")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Owner-Token"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "https://www.10signal.me"));
    }

    @Test
    void rejectsDisallowedOriginPreflight() throws Exception {
        mockMvc.perform(options("/api/v1/tensignal/owner")
                .header("Origin", "https://evil-attacker.example")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Owner-Token"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void rejectsDisallowedHeaderPreflight() throws Exception {
        mockMvc.perform(options("/api/v1/tensignal/owner")
                .header("Origin", "https://10signal.me")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "X-Disallowed-Malicious-Header"))
            .andExpect(status().isForbidden())
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
