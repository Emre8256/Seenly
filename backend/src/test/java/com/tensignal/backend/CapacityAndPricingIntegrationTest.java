package com.tensignal.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.config.PaymentProperties;
import com.tensignal.backend.constant.AppConstants;
import com.tensignal.backend.dto.FriendResponseInput;
import com.tensignal.backend.dto.OwnerDashboardDto;
import com.tensignal.backend.entity.*;
import com.tensignal.backend.exception.QuotaExceededException;
import com.tensignal.backend.payment.EntitlementType;
import com.tensignal.backend.payment.PaymentProductCatalog;
import com.tensignal.backend.payment.PaymentStatus;
import com.tensignal.backend.repository.FriendResponseRepository;
import com.tensignal.backend.repository.PaymentProviderEventRepository;
import com.tensignal.backend.repository.PaymentTransactionRepository;
import com.tensignal.backend.repository.ResponseSessionRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.service.FriendResponseService;
import com.tensignal.backend.service.SnapshotMapperService;
import com.tensignal.backend.service.TokenHashingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "app.payment.provider=lemonsqueezy",
    "app.payment.lemonsqueezy.webhook-secret=test_capacity_secret_123",
    "app.payment.lemonsqueezy.plus-checkout-url=https://tensignal.lemonsqueezy.com/checkout/buy/c31e5d1b-a28d-46b1-99e1-6ec637c927da",
    "app.payment.lemonsqueezy.capacity50-checkout-url=https://tensignal.lemonsqueezy.com/checkout/buy/50-variant-url",
    "app.payment.lemonsqueezy.capacity150-checkout-url=https://tensignal.lemonsqueezy.com/checkout/buy/150-variant-url",
    "app.payment.lemonsqueezy.capacity300-checkout-url=https://tensignal.lemonsqueezy.com/checkout/buy/300-variant-url"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CapacityAndPricingIntegrationTest {

    private static final String WEBHOOK_SECRET = "test_capacity_secret_123";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired TenSignalRepository tenSignalRepository;
    @Autowired ResponseSessionRepository responseSessionRepository;
    @Autowired FriendResponseRepository friendResponseRepository;
    @Autowired PaymentTransactionRepository transactionRepository;
    @Autowired PaymentProviderEventRepository eventRepository;
    @Autowired FriendResponseService friendResponseService;
    @Autowired SnapshotMapperService snapshotMapperService;
    @Autowired PaymentProperties paymentProperties;
    @Autowired TokenHashingService tokenHashingService;

    @BeforeEach
    @AfterEach
    void clean() {
        friendResponseRepository.deleteAll();
        responseSessionRepository.deleteAll();
        eventRepository.deleteAll();
        transactionRepository.deleteAll();
        tenSignalRepository.deleteAll();
        userRepository.deleteAll();
        paymentProperties.getLemonSqueezy().setWebhookSecret(WEBHOOK_SECRET);
    }

    // =========================================================================
    // 1. CAPACITY SPECIFICATION TESTS
    // =========================================================================

    @Test
    void test01_newAccountReceives20FreeCapacityByDefault() {
        User user = userRepository.save(User.builder()
            .email("newuser@example.test")
            .emailVerified(true)
            .build());

        assertThat(user.getBaseFormCapacity()).isEqualTo(20);
        assertThat(user.getPurchasedExtraCapacity()).isZero();
        assertThat(user.getIsPremium()).isFalse();

        TenSignal profile = tenSignalRepository.save(TenSignal.builder()
            .user(user)
            .email(user.getEmail())
            .displayName("New User")
            .publicSlug("slug-free-20")
            .ownerTokenHash("dummy-hash")
            .responseCount(0)
            .isCapped(false)
            .build());

        assertThat(profile.getBaseFormCapacity()).isEqualTo(20);
        assertThat(profile.getTotalAllowedCapacity()).isEqualTo(20);

        ResultSnapshot snapshot = ResultSnapshot.builder().seenly(profile).build();
        OwnerDashboardDto dto = snapshotMapperService.toOwnerDto(snapshot);
        assertThat(dto.getMaxResponseLimit()).isEqualTo(20);
    }

    @Test
    void test02_responseConsumptionStopsExactlyAt20ForFreeUsers() {
        User user = userRepository.save(User.builder().email("consume20@example.test").build());
        TenSignal profile = tenSignalRepository.save(TenSignal.builder()
            .user(user)
            .email(user.getEmail())
            .displayName("Twenty User")
            .publicSlug("slug-twenty")
            .ownerTokenHash("twenty-hash")
            .responseCount(0)
            .isCapped(false)
            .build());

        // Submit 20 distinct evaluations
        for (int i = 1; i <= 20; i++) {
            friendResponseService.processFriendSubmission(
                profile.getPublicSlug(),
                null,
                "10.0.0." + i,
                buildFriendInput("evaluator-device-" + i)
            );
        }

        TenSignal updated = tenSignalRepository.findByPublicSlug(profile.getPublicSlug()).orElseThrow();
        assertThat(updated.getResponseCount()).isEqualTo(20);
        assertThat(updated.isCapped()).isTrue();

        // 21st evaluation must be blocked with QuotaExceededException
        assertThatThrownBy(() -> friendResponseService.processFriendSubmission(
            profile.getPublicSlug(),
            null,
            "10.0.0.21",
            buildFriendInput("evaluator-device-21")
        )).isInstanceOf(QuotaExceededException.class);

        TenSignal still20 = tenSignalRepository.findByPublicSlug(profile.getPublicSlug()).orElseThrow();
        assertThat(still20.getResponseCount()).isEqualTo(20);
    }

    @Test
    void test03_capacityPacksAddCumulatively_Mini_Standard_Large() {
        User user = userRepository.save(User.builder()
            .email("cumulative@example.test")
            .baseFormCapacity(20)
            .purchasedExtraCapacity(0)
            .build());

        TenSignal profile = tenSignalRepository.save(TenSignal.builder()
            .user(user)
            .email(user.getEmail())
            .displayName("Cumulative User")
            .publicSlug("slug-cumulative")
            .ownerTokenHash("cum-hash")
            .responseCount(20)
            .isCapped(true)
            .build());

        // 1. Buy Mini (+50)
        PaymentTransaction miniTx = transactionRepository.saveAndFlush(PaymentTransaction.builder()
            .id(UUID.randomUUID())
            .ownerAccountId(user.getId())
            .ownerProfileId(profile.getId())
            .productCode(PaymentProductCatalog.CAPACITY_50)
            .entitlementType(EntitlementType.RESPONSE_CAPACITY)
            .entitlementQuantity(50)
            .provider("lemonsqueezy")
            .amountMinor(99)
            .currency("USD")
            .status(PaymentStatus.PAID)
            .build());

        // Grant Mini
        user.setPurchasedExtraCapacity(user.getPurchasedExtraCapacity() + 50);
        userRepository.save(user);
        profile.setCapped(false);
        tenSignalRepository.save(profile);

        assertThat(profile.getTotalAllowedCapacity()).isEqualTo(70);
        assertThat(profile.isCapped()).isFalse();

        // 2. Buy Standard (+150)
        user.setPurchasedExtraCapacity(user.getPurchasedExtraCapacity() + 150);
        userRepository.save(user);
        assertThat(profile.getTotalAllowedCapacity()).isEqualTo(220);

        // 3. Buy Large (+300)
        user.setPurchasedExtraCapacity(user.getPurchasedExtraCapacity() + 300);
        userRepository.save(user);
        assertThat(profile.getTotalAllowedCapacity()).isEqualTo(520);
    }

    @Test
    void test04_premiumGivesUnlimitedCapacityAndNeverCaps() {
        User user = userRepository.save(User.builder()
            .email("premium-unlimited@example.test")
            .baseFormCapacity(20)
            .purchasedExtraCapacity(50) // User previously had a mini pack
            .isPremium(true)
            .build());

        TenSignal profile = tenSignalRepository.save(TenSignal.builder()
            .user(user)
            .email(user.getEmail())
            .displayName("Premium User")
            .publicSlug("slug-premium-unlimited")
            .ownerTokenHash("prem-hash")
            .responseCount(500) // High response count
            .isCapped(false)
            .build());

        assertThat(profile.getIsPremium()).isTrue();
        assertThat(profile.getTotalAllowedCapacity()).isEqualTo(-1); // Explicit unlimited
        assertThat(profile.isCapped()).isFalse();

        ResultSnapshot snapshot = ResultSnapshot.builder().seenly(profile).build();
        OwnerDashboardDto dto = snapshotMapperService.toOwnerDto(snapshot);
        assertThat(dto.getMaxResponseLimit()).isEqualTo(-1);

        // Evaluating even with high response count must not be blocked
        friendResponseService.processFriendSubmission(
            profile.getPublicSlug(),
            null,
            "10.0.5.1",
            buildFriendInput("prem-friend-1")
        );

        TenSignal updated = tenSignalRepository.findByPublicSlug(profile.getPublicSlug()).orElseThrow();
        assertThat(updated.getResponseCount()).isEqualTo(501);
        assertThat(updated.isCapped()).isFalse();

        // Previously purchased capacity remains safely preserved on the user entity
        assertThat(user.getPurchasedExtraCapacity()).isEqualTo(50);
    }

    @Test
    void test05_evaluatingOthersDoesNotDeductFromEvaluatorsOwnCapacity() {
        User userA = userRepository.save(User.builder().email("evaluator-a@example.test").build());
        TenSignal profileA = tenSignalRepository.save(TenSignal.builder()
            .user(userA)
            .email(userA.getEmail())
            .displayName("Profile A")
            .publicSlug("slug-user-a")
            .ownerTokenHash("token-a")
            .responseCount(0)
            .isCapped(false)
            .build());

        User userB = userRepository.save(User.builder().email("evaluator-b@example.test").build());
        TenSignal profileB = tenSignalRepository.save(TenSignal.builder()
            .user(userB)
            .email(userB.getEmail())
            .displayName("Profile B")
            .publicSlug("slug-user-b")
            .ownerTokenHash("token-b")
            .responseCount(0)
            .isCapped(false)
            .build());

        // User A evaluates User B
        friendResponseService.processFriendSubmission(
            profileB.getPublicSlug(),
            null,
            "10.0.9.1",
            buildFriendInput("signal-from-a")
        );

        TenSignal updatedB = tenSignalRepository.findByPublicSlug(profileB.getPublicSlug()).orElseThrow();
        assertThat(updatedB.getResponseCount()).isEqualTo(1);

        TenSignal updatedA = tenSignalRepository.findByPublicSlug(profileA.getPublicSlug()).orElseThrow();
        assertThat(updatedA.getResponseCount()).isEqualTo(0);
        assertThat(updatedA.getBaseFormCapacity()).isEqualTo(20);
        assertThat(updatedA.getTotalAllowedCapacity()).isEqualTo(20);
    }

    // =========================================================================
    // 2. PRICING & CHECKOUT REGIONAL RESOLUTION TESTS
    // =========================================================================

    @Test
    void test06_turkeyUserResolvesToSameUsdPricesAsGlobal() throws Exception {
        String rawToken = "raw-owner-token-tr-1234567890";
        String tokenHash = tokenHashingService.hashToken(rawToken);

        User user = userRepository.save(User.builder().email("tr-user@example.test").build());
        TenSignal profile = tenSignalRepository.save(TenSignal.builder()
            .user(user)
            .email(user.getEmail())
            .displayName("TR User")
            .publicSlug("slug-tr")
            .ownerTokenHash(tokenHash)
            .ownerTokenExpiresAt(java.time.Instant.now().plus(java.time.Duration.ofDays(30)))
            .build());

        // 1. Get products from Turkey (CF-IPCountry: TR) -> must resolve to identical USD prices
        mockMvc.perform(get("/api/billing/products")
                .header("CF-IPCountry", "TR"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.productCode == 'response_capacity_50_v2')].amountMinor").value(99))
            .andExpect(jsonPath("$[?(@.productCode == 'response_capacity_50_v2')].currency").value("USD"))
            .andExpect(jsonPath("$[?(@.productCode == 'response_capacity_150_v2')].amountMinor").value(199))
            .andExpect(jsonPath("$[?(@.productCode == 'response_capacity_300_v2')].amountMinor").value(299))
            .andExpect(jsonPath("$[?(@.productCode == 'seenly_plus_v1')].amountMinor").value(399))
            .andExpect(jsonPath("$[?(@.productCode == 'seenly_plus_v1')].currency").value("USD"));

        // 2. Create Checkout for Mini (+50) with Turkey geo header
        String res = mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", rawToken)
                .header("CF-IPCountry", "TR")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"response_capacity_50_v2"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(res);
        String checkoutUrl = json.path("checkoutUrl").asText();
        String txId = json.path("transactionId").asText();

        // URL must NOT include regional TRY or TR parameters
        assertThat(checkoutUrl).doesNotContain("checkout%5Bcurrency%5D=TRY");
        assertThat(checkoutUrl).doesNotContain("checkout%5Bcountry%5D=TR");

        // Transaction record in database must be locked to USD and 99 minor units ($0.99 USD)
        PaymentTransaction tx = transactionRepository.findById(UUID.fromString(txId)).orElseThrow();
        assertThat(tx.getCurrency()).isEqualTo("USD");
        assertThat(tx.getAmountMinor()).isEqualTo(99L);
        assertThat(tx.getEntitlementQuantity()).isEqualTo(50);
    }

    @Test
    void test07_globalCheckoutResolvesToUsdPrices() throws Exception {
        String rawToken = "raw-owner-token-global-1234567890";
        String tokenHash = tokenHashingService.hashToken(rawToken);

        User user = userRepository.save(User.builder().email("global-user@example.test").build());
        TenSignal profile = tenSignalRepository.save(TenSignal.builder()
            .user(user)
            .email(user.getEmail())
            .displayName("Global User")
            .publicSlug("slug-global")
            .ownerTokenHash(tokenHash)
            .ownerTokenExpiresAt(java.time.Instant.now().plus(java.time.Duration.ofDays(30)))
            .build());

        // 1. Get products with global fallback (e.g. CF-IPCountry: US)
        mockMvc.perform(get("/api/billing/products")
                .header("CF-IPCountry", "US"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.productCode == 'response_capacity_50_v2')].amountMinor").value(99))
            .andExpect(jsonPath("$[?(@.productCode == 'response_capacity_50_v2')].currency").value("USD"))
            .andExpect(jsonPath("$[?(@.productCode == 'seenly_plus_v1')].amountMinor").value(399))
            .andExpect(jsonPath("$[?(@.productCode == 'seenly_plus_v1')].currency").value("USD"));

        // 2. Create Checkout for Plus ($3.99)
        String res = mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", rawToken)
                .header("CF-IPCountry", "US")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"productCode":"seenly_plus_v1"}
                    """))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        JsonNode json = objectMapper.readTree(res);
        String txId = json.path("transactionId").asText();

        PaymentTransaction tx = transactionRepository.findById(UUID.fromString(txId)).orElseThrow();
        assertThat(tx.getCurrency()).isEqualTo("USD");
        assertThat(tx.getAmountMinor()).isEqualTo(399L);
    }

    @Test
    void test08_validUsdWebhookGrantsEntitlementAndDuplicateWebhookIsIdempotent() throws Exception {
        User user = userRepository.save(User.builder()
            .email("webhook-usd@example.test")
            .baseFormCapacity(20)
            .purchasedExtraCapacity(0)
            .build());

        TenSignal profile = tenSignalRepository.save(TenSignal.builder()
            .user(user)
            .email(user.getEmail())
            .displayName("USD Webhook")
            .publicSlug("slug-webhook-usd")
            .ownerTokenHash("tok-usd")
            .responseCount(20)
            .isCapped(true)
            .build());

        UUID txId = UUID.randomUUID();
        PaymentTransaction tx = transactionRepository.saveAndFlush(PaymentTransaction.builder()
            .id(txId)
            .ownerAccountId(user.getId())
            .ownerProfileId(profile.getId())
            .productCode(PaymentProductCatalog.CAPACITY_50)
            .entitlementType(EntitlementType.RESPONSE_CAPACITY)
            .entitlementQuantity(50)
            .provider("lemonsqueezy")
            .providerCheckoutId("ls_chk_" + txId)
            .amountMinor(99)
            .currency("USD")
            .status(PaymentStatus.PENDING)
            .build());

        String payload = buildLemonPayload("order_created", "paid", "ls_ord_usd_50", tx, 99, "USD");
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        // 1. Process valid USD payment webhook
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true))
            .andExpect(jsonPath("$.duplicate").value(false));

        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.getPurchasedExtraCapacity()).isEqualTo(50);

        TenSignal updatedProfile = tenSignalRepository.findByPublicSlug(profile.getPublicSlug()).orElseThrow();
        assertThat(updatedProfile.isCapped()).isFalse();
        assertThat(updatedProfile.getTotalAllowedCapacity()).isEqualTo(70);

        // 2. Duplicate webhook replay must be acknowledged as duplicate and NOT grant capacity twice
        mockMvc.perform(post("/api/v1/billing/webhooks/lemonsqueezy")
                .header("X-Signature", hmacHex(WEBHOOK_SECRET, payloadBytes))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payloadBytes))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accepted").value(true))
            .andExpect(jsonPath("$.duplicate").value(true));

        User recheckedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(recheckedUser.getPurchasedExtraCapacity()).isEqualTo(50); // Still 50, not 100!
        TenSignal recheckedProfile = tenSignalRepository.findByPublicSlug(profile.getPublicSlug()).orElseThrow();
        assertThat(recheckedProfile.getTotalAllowedCapacity()).isEqualTo(70); // Still 70!
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private FriendResponseInput buildFriendInput(String signal) {
        FriendResponseInput input = new FriendResponseInput();
        input.setFingerprintHash(signal);
        input.setNickname("Friend");
        List<FriendResponseInput.AnswerInput> answers = new ArrayList<>();
        for (String lens : AppConstants.LENSES) {
            FriendResponseInput.AnswerInput a = new FriendResponseInput.AnswerInput();
            a.setQuestionId("classic_friend_" + lens + "_01");
            a.setAnswerValue(4);
            answers.add(a);
        }
        input.setFriendResponses(answers);
        return input;
    }

    private String buildLemonPayload(String eventName, String status, String orderId, PaymentTransaction tx, long total, String currency) {
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
                  "status": "%s",
                  "currency": "%s",
                  "total": %d,
                  "created_at": "2026-10-12T12:00:00Z"
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
                status,
                currency,
                total
            );
    }

    private String hmacHex(String secret, byte[] data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data);
            return HexFormat.of().formatHex(raw);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
