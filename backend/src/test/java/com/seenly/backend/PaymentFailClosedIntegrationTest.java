package com.seenly.backend;

import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import com.seenly.backend.payment.PaymentProductCatalog;
import com.seenly.backend.repository.PaymentProviderEventRepository;
import com.seenly.backend.repository.PaymentTransactionRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import com.seenly.backend.service.TokenHashingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import com.seenly.backend.payment.PaymentStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentFailClosedIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired PaymentProviderEventRepository eventRepository;
    @Autowired PaymentTransactionRepository transactionRepository;
    @Autowired SeenlyRepository seenlyRepository;
    @Autowired UserRepository userRepository;
    @Autowired TokenHashingService tokenHashingService;

    @BeforeEach
    void clean() {
        eventRepository.deleteAll();
        transactionRepository.deleteAll();
        seenlyRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void disabledProviderCannotCreateCheckoutOrGrantEntitlement() throws Exception {
        User user = userRepository.saveAndFlush(User.builder().email("disabled-payment@example.com").build());
        String token = tokenHashingService.generateRawToken();
        seenlyRepository.saveAndFlush(Seenly.builder()
            .user(user)
            .email(user.getEmail())
            .displayName("Disabled Payment")
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken(token))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600))
            .build());

        mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productCode\":\"" + PaymentProductCatalog.SEENLY_PLUS + "\"}"))
            .andExpect(status().isServiceUnavailable());

        assertThat(transactionRepository.findAll()).singleElement().satisfies(transaction -> {
            assertThat(transaction.getStatus()).isEqualTo(PaymentStatus.CREATED);
            assertThat(transaction.getEntitlementGrantedAt()).isNull();
        });
        assertThat(userRepository.findById(user.getId()).orElseThrow().getIsPremium()).isFalse();
    }
}
