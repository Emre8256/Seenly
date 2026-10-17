package com.tensignal.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.config.PaymentProperties;
import com.tensignal.backend.entity.PaymentProviderEvent;
import com.tensignal.backend.entity.PaymentTransaction;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.payment.EntitlementReversalStatus;
import com.tensignal.backend.payment.PaymentEventOutcome;
import com.tensignal.backend.payment.PaymentEventType;
import com.tensignal.backend.payment.PaymentStatus;
import com.tensignal.backend.repository.PaymentProviderEventRepository;
import com.tensignal.backend.repository.PaymentTransactionRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.service.TokenHashingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.payment.provider=lemonsqueezy",
    "app.payment.lemonsqueezy.webhook-secret=test_ls_secret_xyz",
    "app.payment.lemonsqueezy.plus-checkout-url=https://tenSignal.lemonsqueezy.com/checkout/buy/c31e5d1b-a28d-46b1-99e1-6ec637c927da",
    "app.payment.lemonsqueezy.capacity100-checkout-url=https://tenSignal.lemonsqueezy.com/checkout/buy/9e4aa985-a2dc-46da-a20a-246bc2d9e83c",
    "app.payment.lemonsqueezy.capacity250-checkout-url=https://tenSignal.lemonsqueezy.com/checkout/buy/90f059cc-bd69-487a-9acf-f4f2f5d6c42b",
    "app.payment.lemonsqueezy.capacity500-checkout-url=https://tenSignal.lemonsqueezy.com/checkout/buy/06107728-bcbb-42fa-b72e-3d7120db82ba"
})
class LemonSqueezyIntegrationTest {

    private static final String WEBHOOK_SECRET = "test_ls_secret_xyz";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PaymentProperties paymentProperties;
    @Autowired PaymentTransactionRepository transactionRepository;
    @Autowired PaymentProviderEventRepository eventRepository;
    @Autowired UserRepository userRepository;
    @Autowired TenSignalRepository tenSignalRepository;
    @Autowired TokenHashingService tokenHashingService;

    @BeforeEach
    void clean() {
        eventRepository.deleteAll();
        transactionRepository.deleteAll();
        tenSignalRepository.deleteAll();
        userRepository.deleteAll();
        paymentProperties.getLemonSqueezy().setWebhookSecret(WEBHOOK_SECRET);
    }

    @AfterEach
    void tearDown() {
        clean();
    }

    // =========================================================================
    // Hosted Checkout Creation Tests (All 4 Products + Security)
    // =========================================================================

    @Test
    void testCheckoutCreationSuccessForTenSignalPlus() throws Exception {
        OwnerContext owner = createOwner();

        String response = mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", owner.rawToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"seenly_plus_v1"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.provider").value("lemonsqueezy"))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.checkoutUrl").exists())
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        String checkoutUrl = json.path("checkoutUrl").asText();
        String transactionIdStr = json.path("transactionId").asText();

        assertThat(checkoutUrl).contains("https://tenSignal.lemonsqueezy.com/checkout/buy/c31e5d1b-a28d-46b1-99e1-6ec637c927da");
        assertThat(checkoutUrl).contains(transactionIdStr);

        PaymentTransaction tx = transactionRepository.findById(UUID.fromString(transactionIdStr)).orElseThrow();
        assertThat(tx.getAmountMinor()).isEqualTo(399L);
        assertThat(tx.getCurrency()).isEqualTo("USD");
        assertThat(tx.getProductCode()).isEqualTo("seenly_plus_v1");
        assertThat(tx.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(tx.getProviderCheckoutId()).isEqualTo("ls_chk_" + tx.getId());
    }

    @Test
    void testCheckoutCreationSuccessForCapacity100() throws Exception {
        OwnerContext owner = createOwner();

        String response = mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", owner.rawToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"response_capacity_100_v1"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.provider").value("lemonsqueezy"))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.checkoutUrl").exists())
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        String checkoutUrl = json.path("checkoutUrl").asText();
        String transactionIdStr = json.path("transactionId").asText();

        assertThat(checkoutUrl).contains("https://tenSignal.lemonsqueezy.com/checkout/buy/9e4aa985-a2dc-46da-a20a-246bc2d9e83c");
        assertThat(checkoutUrl).contains(transactionIdStr);
        assertThat(checkoutUrl).contains("checkout%5Bcustom%5D%5Bproduct_code%5D=response_capacity_100_v1");

        PaymentTransaction tx = transactionRepository.findById(UUID.fromString(transactionIdStr)).orElseThrow();
        assertThat(tx.getAmountMinor()).isEqualTo(99L);
        assertThat(tx.getCurrency()).isEqualTo("USD");
        assertThat(tx.getProductCode()).isEqualTo("response_capacity_100_v1");
        assertThat(tx.getEntitlementQuantity()).isEqualTo(100);
        assertThat(tx.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void testCheckoutCreationSuccessForCapacity250() throws Exception {
        OwnerContext owner = createOwner();

        String response = mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", owner.rawToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"response_capacity_250_v1"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.provider").value("lemonsqueezy"))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.checkoutUrl").exists())
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        String checkoutUrl = json.path("checkoutUrl").asText();
        String transactionIdStr = json.path("transactionId").asText();

        assertThat(checkoutUrl).contains("https://tenSignal.lemonsqueezy.com/checkout/buy/90f059cc-bd69-487a-9acf-f4f2f5d6c42b");
        assertThat(checkoutUrl).contains(transactionIdStr);
        assertThat(checkoutUrl).contains("checkout%5Bcustom%5D%5Bproduct_code%5D=response_capacity_250_v1");

        PaymentTransaction tx = transactionRepository.findById(UUID.fromString(transactionIdStr)).orElseThrow();
        assertThat(tx.getAmountMinor()).isEqualTo(199L);
        assertThat(tx.getCurrency()).isEqualTo("USD");
        assertThat(tx.getProductCode()).isEqualTo("response_capacity_250_v1");
        assertThat(tx.getEntitlementQuantity()).isEqualTo(250);
        assertThat(tx.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void testCheckoutCreationSuccessForCapacity500() throws Exception {
        OwnerContext owner = createOwner();

        String response = mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", owner.rawToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"response_capacity_500_v1"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.provider").value("lemonsqueezy"))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.checkoutUrl").exists())
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        String checkoutUrl = json.path("checkoutUrl").asText();
        String transactionIdStr = json.path("transactionId").asText();

        assertThat(checkoutUrl).contains("https://tenSignal.lemonsqueezy.com/checkout/buy/06107728-bcbb-42fa-b72e-3d7120db82ba");
        assertThat(checkoutUrl).contains(transactionIdStr);
        assertThat(checkoutUrl).contains("checkout%5Bcustom%5D%5Bproduct_code%5D=response_capacity_500_v1");

        PaymentTransaction tx = transactionRepository.findById(UUID.fromString(transactionIdStr)).orElseThrow();
        assertThat(tx.getAmountMinor()).isEqualTo(399L);
        assertThat(tx.getCurrency()).isEqualTo("USD");
        assertThat(tx.getProductCode()).isEqualTo("response_capacity_500_v1");
        assertThat(tx.getEntitlementQuantity()).isEqualTo(500);
        assertThat(tx.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void testCheckoutCreationRejectsClientTamperedFields() throws Exception {
        OwnerContext owner = createOwner();

        mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", owner.rawToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "productCode": "response_capacity_100_v1",
                      "amountMinor": 1,
                      "currency": "EUR",
                      "capacityAmount": 99999
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void testCheckoutCreationRejectsUnknownProduct() throws Exception {
        OwnerContext owner = createOwner();

        mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", owner.rawToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"fake_unknown_pack_v1"}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void testCheckoutCreationUnauthenticatedFails() throws Exception {
        mockMvc.perform(post("/api/billing/checkouts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"seenly_plus_v1"}
                    """))
            .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 20 Required Webhook Test Scenarios
    // =========================================================================

    // 1. Valid order_created + Plus -> Premium aktif
    @Test
    void test01_ValidOrderCreatedPlusGrantsPremium() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_plus_1", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true))
            .andExpect(jsonPath("$.duplicate").value(false))
            .andExpect(jsonPath("$.status").value("PAID"));

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isTrue();
        assertThat(user.getPremiumPaymentTransactionId()).isEqualTo(tx.getId());
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(0);

        PaymentTransaction txAfter = transactionRepository.findById(tx.getId()).orElseThrow();
        assertThat(txAfter.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(txAfter.getEntitlementGrantedAt()).isNotNull();
    }

    // 2. Valid order_created + Mini -> +100 capacity
    @Test
    void test02_ValidOrderCreatedMiniGrants100Capacity() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "response_capacity_100_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_mini_1", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true))
            .andExpect(jsonPath("$.status").value("PAID"));

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(100);
    }

    // 3. Valid order_created + Standard -> +250 capacity
    @Test
    void test03_ValidOrderCreatedStandardGrants250Capacity() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "response_capacity_250_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_std_1", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true))
            .andExpect(jsonPath("$.status").value("PAID"));

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(250);
    }

    // 4. Valid order_created + Maxi -> +500 capacity
    @Test
    void test04_ValidOrderCreatedMaxiGrants500Capacity() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "response_capacity_500_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_maxi_1", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true))
            .andExpect(jsonPath("$.status").value("PAID"));

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(500);
    }

    // 5. Invalid signature -> rejected (401)
    @Test
    void test05_InvalidSignatureRejected() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_bad_sig", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", "deadbeefcafe0123456789")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isUnauthorized());

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
    }

    // 6. Missing signature -> rejected (401)
    @Test
    void test06_MissingSignatureRejected() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_no_sig", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isUnauthorized());

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
    }

    // 7. Missing webhook secret -> fail-closed (503)
    @Test
    void test07_MissingWebhookSecretFailClosed() throws Exception {
        paymentProperties.getLemonSqueezy().setWebhookSecret("");

        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_no_secret", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", "some_sig")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isServiceUnavailable());

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
    }

    // 8. Tampered body -> rejected (401)
    @Test
    void test08_TamperedBodyRejected() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String originalPayload = buildLemonPayload("order_created", "paid", "ls_ord_orig", tx);
        byte[] originalBytes = originalPayload.getBytes(StandardCharsets.UTF_8);
        String signatureOfOriginal = hmacHex(WEBHOOK_SECRET, originalBytes);

        // Tamper with body: replace order id with different id
        String tamperedPayload = originalPayload.replace("ls_ord_orig", "ls_ord_tampered");
        byte[] tamperedBytes = tamperedPayload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", signatureOfOriginal)
                .contentType(MediaType.APPLICATION_JSON)
                .content(tamperedBytes))
            .andExpect(status().isUnauthorized());

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
    }

    // 9. Unknown transaction -> entitlement verilmez (400)
    @Test
    void test09_UnknownTransactionNoEntitlement() throws Exception {
        OwnerContext owner = createOwner();
        UUID fakeTxId = UUID.randomUUID();

        String payload = """
            {
              "meta": {
                "event_name": "order_created",
                "custom_data": {
                  "transaction_id": "%s",
                  "owner_account_id": "%s",
                  "product_code": "seenly_plus_v1",
                  "checkout_id": "ls_chk_%s"
                }
              },
              "data": {
                "id": "ls_ord_unknown_tx",
                "type": "orders",
                "attributes": {
                  "identifier": "ls_ord_unknown_tx",
                  "status": "paid",
                  "total": 399,
                  "currency": "USD",
                  "created_at": "2026-09-15T12:00:00Z"
                }
              }
            }
            """.formatted(fakeTxId, owner.userId(), fakeTxId);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isBadRequest());

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
    }

    // 10. Wrong provider -> entitlement verilmez (400)
    @Test
    void test10_WrongProviderNoEntitlement() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_wrong_prov", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/unsupported_provider")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isBadRequest());

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
    }

    // 11. Product mismatch -> entitlement verilmez (400)
    @Test
    void test11_ProductMismatchNoEntitlement() throws Exception {
        OwnerContext owner = createOwner();
        // Server transaction is for seenly_plus_v1
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        // Webhook custom_data claims product_code is response_capacity_100_v1
        String payload = """
            {
              "meta": {
                "event_name": "order_created",
                "custom_data": {
                  "transaction_id": "%s",
                  "owner_account_id": "%s",
                  "product_code": "response_capacity_100_v1",
                  "checkout_id": "%s"
                }
              },
              "data": {
                "id": "ls_ord_mismatch",
                "type": "orders",
                "attributes": {
                  "identifier": "ls_ord_mismatch",
                  "status": "paid",
                  "total": 99,
                  "currency": "USD",
                  "created_at": "2026-09-15T12:00:00Z"
                }
              }
            }
            """.formatted(tx.getId(), tx.getOwnerAccountId(), tx.getProviderCheckoutId());
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isBadRequest());

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(0);
    }

    // 12. order_created status != paid -> entitlement verilmez (acknowledged safely)
    @Test
    void test12_OrderCreatedStatusNotPaidNoEntitlement() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String payload = buildLemonPayload("order_created", "pending", "ls_ord_pending", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true));

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();

        PaymentTransaction txAfter = transactionRepository.findById(tx.getId()).orElseThrow();
        assertThat(txAfter.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    // 13. Duplicate Plus webhook -> ikinci entitlement yok
    @Test
    void test13_DuplicatePlusWebhookNoSecondEntitlement() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_dup_plus", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String sig = hmacHex(WEBHOOK_SECRET, payloadBytes);

        // 1st delivery
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", sig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true))
            .andExpect(jsonPath("$.duplicate").value(false));

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isTrue();

        // 2nd delivery (duplicate)
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", sig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true))
            .andExpect(jsonPath("$.duplicate").value(true));

        User userAfterDup = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(userAfterDup.getIsPremium()).isTrue();
        assertThat(eventRepository.findAll()).hasSize(1);
    }

    // 14. Duplicate Mini webhook -> ikinci +100 yok
    @Test
    void test14_DuplicateMiniWebhookNoSecondCapacity() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "response_capacity_100_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_dup_mini", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String sig = hmacHex(WEBHOOK_SECRET, payloadBytes);

        // 1st delivery -> 100 capacity
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", sig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.duplicate").value(false));

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(100);

        // 2nd delivery -> must stay 100, not 200!
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", sig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.duplicate").value(true));

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(100);
    }

    // 15. Duplicate Standard webhook -> ikinci +250 yok
    @Test
    void test15_DuplicateStandardWebhookNoSecondCapacity() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "response_capacity_250_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_dup_std", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String sig = hmacHex(WEBHOOK_SECRET, payloadBytes);

        // 1st delivery -> 250 capacity
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", sig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.duplicate").value(false));

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(250);

        // 2nd delivery -> must stay 250, not 500!
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", sig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.duplicate").value(true));

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(250);
    }

    // 16. Duplicate Maxi webhook -> ikinci +500 yok
    @Test
    void test16_DuplicateMaxiWebhookNoSecondCapacity() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "response_capacity_500_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_dup_maxi", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String sig = hmacHex(WEBHOOK_SECRET, payloadBytes);

        // 1st delivery -> 500 capacity
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", sig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.duplicate").value(false));

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(500);

        // 2nd delivery -> must stay 500, not 1000!
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", sig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.duplicate").value(true));

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(500);
    }

    // 17. Duplicate refund -> ikinci revoke yok
    @Test
    void test17_DuplicateRefundNoSecondRevoke() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        // Pay first
        String paidPayload = buildLemonPayload("order_created", "paid", "ls_ord_ref_dup", tx);
        byte[] paidBytes = paidPayload.getBytes(StandardCharsets.UTF_8);
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, paidBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(paidBytes))
            .andExpect(status().isOk());

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getIsPremium()).isTrue();

        // 1st refund delivery
        tx = transactionRepository.findById(tx.getId()).orElseThrow();
        String refundPayload = buildLemonPayload("order_refunded", "refunded", "ls_ord_ref_dup", tx);
        byte[] refundBytes = refundPayload.getBytes(StandardCharsets.UTF_8);
        String refSig = hmacHex(WEBHOOK_SECRET, refundBytes);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", refSig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(refundBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.duplicate").value(false))
            .andExpect(jsonPath("$.status").value("REFUNDED"));

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getIsPremium()).isFalse();

        // 2nd refund delivery (duplicate)
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", refSig)
                .contentType(MediaType.APPLICATION_JSON)
                .content(refundBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.duplicate").value(true));

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getIsPremium()).isFalse();
    }

    // 18. Unknown event -> entitlement verilmeden güvenli acknowledge (200 OK)
    @Test
    void test18_UnknownEventSafelyAcknowledgedWithoutEntitlement() throws Exception {
        OwnerContext owner = createOwner();

        String payload = """
            {
              "meta": {
                "event_name": "subscription_created"
              },
              "data": {
                "id": "sub_sub_12345",
                "type": "subscriptions",
                "attributes": {
                  "status": "active"
                }
              }
            }
            """;
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true));

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(0);
        assertThat(transactionRepository.findAll()).isEmpty();
    }

    // 19. Client/webhook payload'ında fiyat değiştirilmesi -> catalog fiyatı değişmez (400)
    @Test
    void test19_WebhookPriceTamperingRejected() throws Exception {
        OwnerContext owner = createOwner();
        // Server catalog price for seenly_plus_v1 is 399 ($3.99)
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");
        assertThat(tx.getAmountMinor()).isEqualTo(399L);

        // Attacker generates signed webhook but attempts to pay only 1 cent (amountMinor = 1)
        String payload = """
            {
              "meta": {
                "event_name": "order_created",
                "custom_data": {
                  "transaction_id": "%s",
                  "owner_account_id": "%s",
                  "product_code": "%s",
                  "checkout_id": "%s"
                }
              },
              "data": {
                "id": "ls_ord_price_tamper",
                "type": "orders",
                "attributes": {
                  "identifier": "ls_ord_price_tamper",
                  "status": "paid",
                  "total": 1,
                  "currency": "USD",
                  "created_at": "2026-09-15T12:00:00Z"
                }
              }
            }
            """.formatted(tx.getId(), tx.getOwnerAccountId(), tx.getProductCode(), tx.getProviderCheckoutId());
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isBadRequest());

        // Server transaction and user are completely untouched
        PaymentTransaction txAfter = transactionRepository.findById(tx.getId()).orElseThrow();
        assertThat(txAfter.getAmountMinor()).isEqualTo(399L);
        assertThat(txAfter.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(userRepository.findById(owner.userId()).orElseThrow().getIsPremium()).isFalse();
    }

    // 20. Capacity amount değiştirilmesi -> catalog capacity değişmez
    @Test
    void test20_CapacityTamperingDoesNotAffectServerCatalog() throws Exception {
        OwnerContext owner = createOwner();
        // Mini Pack is strictly +100 in catalog
        PaymentTransaction tx = createPendingTransaction(owner, "response_capacity_100_v1");
        assertThat(tx.getEntitlementQuantity()).isEqualTo(100);

        // Attacker payload attempts to inject arbitrary capacity in custom_data
        String payload = """
            {
              "meta": {
                "event_name": "order_created",
                "custom_data": {
                  "transaction_id": "%s",
                  "owner_account_id": "%s",
                  "product_code": "response_capacity_100_v1",
                  "checkout_id": "%s",
                  "capacityAmount": 999999
                }
              },
              "data": {
                "id": "ls_ord_cap_tamper",
                "type": "orders",
                "attributes": {
                  "identifier": "ls_ord_cap_tamper",
                  "status": "paid",
                  "total": 99,
                  "currency": "USD",
                  "created_at": "2026-09-15T12:00:00Z"
                }
              }
            }
            """.formatted(tx.getId(), tx.getOwnerAccountId(), tx.getProviderCheckoutId());
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PAID"));

        // Capacity granted is strictly +100 from server catalog (never 999999)
        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(100);
        assertThat(user.getIsPremium()).isFalse();
    }

    // Extra: Capacity Pack Refund flags MANUAL_REVIEW_REQUIRED without touching quota
    @Test
    void testCapacityPackRefundDoesNotProduceNegativeOrDecreasedQuota() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "response_capacity_100_v1");

        // 1. Pay
        String paidPayload = buildLemonPayload("order_created", "paid", "ls_ord_cap_ref", tx);
        byte[] paidBytes = paidPayload.getBytes(StandardCharsets.UTF_8);
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, paidBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(paidBytes))
            .andExpect(status().isOk());

        assertThat(userRepository.findById(owner.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(100);

        // 2. Refund
        tx = transactionRepository.findById(tx.getId()).orElseThrow();
        String refPayload = buildLemonPayload("order_refunded", "refunded", "ls_ord_cap_ref", tx);
        byte[] refBytes = refPayload.getBytes(StandardCharsets.UTF_8);
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, refBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(refBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("REFUNDED"));

        // User quota remains protected (fail-closed, not decreased)
        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(100);

        // Transaction flagged as MANUAL_REVIEW_REQUIRED
        PaymentTransaction txRef = transactionRepository.findById(tx.getId()).orElseThrow();
        assertThat(txRef.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(txRef.getReversalStatus()).isEqualTo(EntitlementReversalStatus.MANUAL_REVIEW_REQUIRED);
    }

    // Compatibility: /api/billing/webhooks/lemonsqueezy endpoint works identically
    @Test
    void testLegacyBillingWebhookPathAlsoSupported() throws Exception {
        OwnerContext owner = createOwner();
        PaymentTransaction tx = createPendingTransaction(owner, "seenly_plus_v1");

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_compat", tx);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true));

        User user = userRepository.findById(owner.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isTrue();
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private PaymentTransaction createPendingTransaction(OwnerContext owner, String productCode) throws Exception {
        String response = mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", owner.rawToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"%s"}
                    """.formatted(productCode)))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        UUID txId = UUID.fromString(objectMapper.readTree(response).path("transactionId").asText());
        return transactionRepository.findById(txId).orElseThrow();
    }

    private String buildLemonPayload(String eventName, String status, String orderId, PaymentTransaction tx) {
        return """
            {
              "meta": {
                "event_name": "%s",
                "custom_data": {
                  "transaction_id": "%s",
                  "owner_account_id": "%s",
                  "product_code": "%s",
                  "checkout_id": "%s"
                }
              },
              "data": {
                "id": "%s",
                "type": "orders",
                "attributes": {
                  "identifier": "%s",
                  "status": "%s",
                  "total": %d,
                  "currency": "%s",
                  "created_at": "2026-09-15T12:00:00Z"
                }
              }
            }
            """.formatted(
            eventName,
            tx.getId(),
            tx.getOwnerAccountId(),
            tx.getProductCode(),
            tx.getProviderCheckoutId(),
            orderId,
            orderId,
            status,
            tx.getAmountMinor(),
            tx.getCurrency()
        );
    }

    private String hmacHex(String secret, byte[] payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private OwnerContext createOwner() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        String email = "ls_owner_" + unique + "@example.com";
        User user = userRepository.save(User.builder()
            .email(email)
            .isPremium(false)
            .baseFormCapacity(20)
            .purchasedExtraCapacity(0)
            .build());

        String rawToken = "owner_token_" + UUID.randomUUID();
        TenSignal tenSignal = tenSignalRepository.save(TenSignal.builder()
            .user(user)
            .displayName("Owner Test " + unique)
            .email(email)
            .publicSlug("ls-" + unique)
            .ownerTokenHash(tokenHashingService.hashToken(rawToken))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600))
            .build());

        return new OwnerContext(user.getId(), tenSignal.getId(), rawToken);
    }

    private record OwnerContext(UUID userId, UUID seenlyId, String rawToken) { }
}
