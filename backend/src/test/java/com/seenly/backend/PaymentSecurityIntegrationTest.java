package com.seenly.backend;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seenly.backend.entity.PaymentProviderEvent;
import com.seenly.backend.entity.PaymentTransaction;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import com.seenly.backend.payment.PaymentEventType;
import com.seenly.backend.payment.PaymentProductCatalog;
import com.seenly.backend.payment.PaymentStatus;
import com.seenly.backend.repository.PaymentProviderEventRepository;
import com.seenly.backend.repository.PaymentTransactionRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import com.seenly.backend.service.TokenHashingService;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.slf4j.LoggerFactory;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.payment.provider=test-hmac",
    "app.payment.test-webhook-secret=payment-test-secret",
    "app.rate-limit.owner-mutations=1000"
})
class PaymentSecurityIntegrationTest {
    private static final String SECRET = "payment-test-secret";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PaymentTransactionRepository transactionRepository;
    @SpyBean PaymentProviderEventRepository eventRepository;
    @Autowired SeenlyRepository seenlyRepository;
    @Autowired UserRepository userRepository;
    @Autowired TokenHashingService tokenHashingService;
    @Autowired MeterRegistry meterRegistry;

    @BeforeEach
    void clean() {
        reset(eventRepository);
        eventRepository.deleteAll();
        transactionRepository.deleteAll();
        seenlyRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void catalogRejectsUnknownProductAndClientOwnedEntitlementValues() throws Exception {
        Profile profile = profile("catalog@example.com");

        mockMvc.perform(get("/api/billing/products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.productCode == 'seenly_plus_v1')]").exists())
            .andExpect(jsonPath("$[?(@.capacityAmount == 250)]").exists());

        checkout(profile, "made_up_product").andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/billing/checkouts")
                .header("X-Owner-Token", profile.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productCode\":\"response_capacity_100_v1\",\"capacityAmount\":9999}"))
            .andExpect(status().isBadRequest());
        assertThat(transactionRepository.count()).isZero();
    }

    @Test
    void checkoutCreationDoesNotGrantEntitlement() throws Exception {
        Profile profile = profile("checkout@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);

        assertThat(checkout.status()).isEqualTo("PENDING");
        User user = userRepository.findById(profile.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
        assertThat(transactionRepository.findById(checkout.transactionId()).orElseThrow().getEntitlementGrantedAt()).isNull();
    }

    @Test
    void missingAndInvalidSignaturesAreRejected() throws Exception {
        Profile profile = profile("signature@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
        byte[] payload = payload(checkout, profile.userId(), "evt-signature", "provider-tx-signature",
            PaymentEventType.PAYMENT_PAID, Instant.parse("2026-09-06T10:00:00Z"));

        webhook(payload, null).andExpect(status().isUnauthorized());
        webhook(payload, "sha256=00").andExpect(status().isUnauthorized());
        byte[] malformed = "{not-json}".getBytes(StandardCharsets.UTF_8);
        webhook(malformed, sign(malformed)).andExpect(status().isBadRequest());
        assertThat(userRepository.findById(profile.userId()).orElseThrow().getIsPremium()).isFalse();
    }

    @Test
    void oversizedWebhookIsRejectedBeforeSignatureProcessing() throws Exception {
        byte[] oversized = new byte[65_537];
        mockMvc.perform(post("/api/billing/webhooks/test-hmac")
                .contentType(MediaType.APPLICATION_JSON)
                .content(oversized))
            .andExpect(status().isPayloadTooLarge());
    }

    @Test
    void legacyDirectGrantEndpointsAreNotReachable() throws Exception {
        Profile profile = profile("legacy-direct@example.com");
        mockMvc.perform(post("/api/billing/subscribe-plus").header("X-Owner-Token", profile.token()))
            .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/billing/buy-pack").header("X-Owner-Token", profile.token()).queryParam("amount", "500"))
            .andExpect(status().isNotFound());
        User user = userRepository.findById(profile.userId()).orElseThrow();
        assertThat(user.getIsPremium()).isFalse();
        assertThat(user.getPurchasedExtraCapacity()).isZero();
    }

    @Test
    void validPaidEventGrantsPlusExactlyOnceAcrossDuplicateAndReplay() throws Exception {
        Profile profile = profile("plus@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
        Instant paidAt = Instant.parse("2026-09-06T10:00:00Z");
        byte[] paid = payload(checkout, profile.userId(), "evt-plus-paid", "provider-tx-plus",
            PaymentEventType.PAYMENT_PAID, paidAt);

        webhook(paid, sign(paid)).andExpect(status().isOk()).andExpect(jsonPath("$.duplicate").value(false));
        webhook(paid, sign(paid)).andExpect(status().isOk()).andExpect(jsonPath("$.duplicate").value(true));
        byte[] replay = payload(checkout, profile.userId(), "evt-plus-replay", "provider-tx-plus",
            PaymentEventType.PAYMENT_PAID, paidAt.plusSeconds(1));
        webhook(replay, sign(replay)).andExpect(status().isOk());

        User user = userRepository.findById(profile.userId()).orElseThrow();
        PaymentTransaction transaction = transactionRepository.findById(checkout.transactionId()).orElseThrow();
        assertThat(user.getIsPremium()).isTrue();
        assertThat(user.getPremiumPaymentTransactionId()).isEqualTo(transaction.getId());
        assertThat(transaction.getEntitlementGrantedAt()).isEqualTo(paidAt);
        assertThat(eventRepository.count()).isEqualTo(2);
    }

    @Test
    void validCapacityEventAddsOnlyCatalogCapacityOnce() throws Exception {
        Profile profile = profile("capacity@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.CAPACITY_250);
        byte[] paid = payload(checkout, profile.userId(), "evt-capacity", "provider-tx-capacity",
            PaymentEventType.PAYMENT_PAID, Instant.parse("2026-09-06T10:00:00Z"));

        webhook(paid, sign(paid)).andExpect(status().isOk());
        webhook(paid, sign(paid)).andExpect(status().isOk());

        assertThat(userRepository.findById(profile.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(250);
    }

    @Test
    void eventBoundToUserACannotGrantUserB() throws Exception {
        Profile userA = profile("owner-a-payment@example.com");
        Profile userB = profile("owner-b-payment@example.com");
        Checkout checkoutA = createCheckout(userA, PaymentProductCatalog.SEENLY_PLUS);
        byte[] forged = payload(checkoutA, userB.userId(), "evt-forged-owner", "provider-tx-forged",
            PaymentEventType.PAYMENT_PAID, Instant.parse("2026-09-06T10:00:00Z"));

        webhook(forged, sign(forged)).andExpect(status().isBadRequest());
        assertThat(userRepository.findById(userA.userId()).orElseThrow().getIsPremium()).isFalse();
        assertThat(userRepository.findById(userB.userId()).orElseThrow().getIsPremium()).isFalse();
    }

    @Test
    void failedCancelledAndExpiredPaymentsDoNotGrantEntitlements() throws Exception {
        for (PaymentEventType type : new PaymentEventType[] {
            PaymentEventType.PAYMENT_FAILED, PaymentEventType.PAYMENT_CANCELLED, PaymentEventType.CHECKOUT_EXPIRED}) {
            Profile profile = profile(type.name().toLowerCase() + "@example.com");
            Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
            byte[] event = payload(checkout, profile.userId(), "evt-" + type, "provider-tx-" + type,
                type, Instant.parse("2026-09-06T10:00:00Z"));
            webhook(event, sign(event)).andExpect(status().isOk());
            assertThat(userRepository.findById(profile.userId()).orElseThrow().getIsPremium()).isFalse();
            assertThat(transactionRepository.findById(checkout.transactionId()).orElseThrow().getEntitlementGrantedAt()).isNull();
        }
    }

    @Test
    void refundAndChargebackUpdateLedgerAndReverseOnlyTraceablePlus() throws Exception {
        for (PaymentEventType reversal : new PaymentEventType[] {
            PaymentEventType.PAYMENT_REFUNDED, PaymentEventType.PAYMENT_CHARGEBACK}) {
            Profile profile = profile(reversal.name().toLowerCase() + "@example.com");
            Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
            Instant paidAt = Instant.parse("2026-09-06T10:00:00Z");
            byte[] paid = payload(checkout, profile.userId(), "evt-paid-" + reversal, "provider-tx-" + reversal,
                PaymentEventType.PAYMENT_PAID, paidAt);
            webhook(paid, sign(paid)).andExpect(status().isOk());
            byte[] reversed = payload(checkout, profile.userId(), "evt-reversal-" + reversal, "provider-tx-" + reversal,
                reversal, paidAt.plusSeconds(60));
            webhook(reversed, sign(reversed)).andExpect(status().isOk());

            PaymentTransaction transaction = transactionRepository.findById(checkout.transactionId()).orElseThrow();
            assertThat(transaction.getStatus()).isEqualTo(
                reversal == PaymentEventType.PAYMENT_REFUNDED ? PaymentStatus.REFUNDED : PaymentStatus.CHARGEBACK);
            assertThat(userRepository.findById(profile.userId()).orElseThrow().getIsPremium()).isFalse();
        }
    }

    @Test
    void multiplePlusPurchasesRemainActiveUntilEveryPaidSourceIsReversed() throws Exception {
        Profile profile = profile("multiple-plus@example.com");
        Checkout first = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
        Checkout second = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
        Instant at = Instant.parse("2026-09-06T10:00:00Z");

        byte[] firstPaid = payload(first, profile.userId(), "evt-multi-first-paid", "provider-tx-multi-first",
            PaymentEventType.PAYMENT_PAID, at);
        webhook(firstPaid, sign(firstPaid)).andExpect(status().isOk());
        byte[] secondPaid = payload(second, profile.userId(), "evt-multi-second-paid", "provider-tx-multi-second",
            PaymentEventType.PAYMENT_PAID, at.plusSeconds(10));
        webhook(secondPaid, sign(secondPaid)).andExpect(status().isOk());

        byte[] secondRefund = payload(second, profile.userId(), "evt-multi-second-refund", "provider-tx-multi-second",
            PaymentEventType.PAYMENT_REFUNDED, at.plusSeconds(20));
        webhook(secondRefund, sign(secondRefund)).andExpect(status().isOk());
        User afterFirstRefund = userRepository.findById(profile.userId()).orElseThrow();
        assertThat(afterFirstRefund.getIsPremium()).isTrue();
        assertThat(afterFirstRefund.getPremiumPaymentTransactionId()).isEqualTo(first.transactionId());

        byte[] firstRefund = payload(first, profile.userId(), "evt-multi-first-refund", "provider-tx-multi-first",
            PaymentEventType.PAYMENT_REFUNDED, at.plusSeconds(30));
        webhook(firstRefund, sign(firstRefund)).andExpect(status().isOk());
        User afterAllRefunds = userRepository.findById(profile.userId()).orElseThrow();
        assertThat(afterAllRefunds.getIsPremium()).isFalse();
        assertThat(afterAllRefunds.getPremiumPaymentTransactionId()).isNull();
    }

    @Test
    void capacityRefundIsRecordedWithoutUnsafeSubtraction() throws Exception {
        Profile profile = profile("capacity-refund@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.CAPACITY_100);
        Instant paidAt = Instant.parse("2026-09-06T10:00:00Z");
        byte[] paid = payload(checkout, profile.userId(), "evt-cap-paid", "provider-tx-cap-refund",
            PaymentEventType.PAYMENT_PAID, paidAt);
        webhook(paid, sign(paid)).andExpect(status().isOk());
        byte[] refund = payload(checkout, profile.userId(), "evt-cap-refund", "provider-tx-cap-refund",
            PaymentEventType.PAYMENT_REFUNDED, paidAt.plusSeconds(60));
        webhook(refund, sign(refund)).andExpect(status().isOk());

        PaymentTransaction transaction = transactionRepository.findById(checkout.transactionId()).orElseThrow();
        assertThat(transaction.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
        assertThat(transaction.getReversalStatus().name()).isEqualTo("MANUAL_REVIEW_REQUIRED");
        assertThat(transaction.getResponseCountAtGrant()).isZero();
        assertThat(userRepository.findById(profile.userId()).orElseThrow().getPurchasedExtraCapacity()).isEqualTo(100);
    }

    @Test
    void olderReplayCannotRevertNewerFinalState() throws Exception {
        Profile profile = profile("stale@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
        Instant paidAt = Instant.parse("2026-09-06T10:00:00Z");
        byte[] paid = payload(checkout, profile.userId(), "evt-stale-paid", "provider-tx-stale",
            PaymentEventType.PAYMENT_PAID, paidAt);
        webhook(paid, sign(paid)).andExpect(status().isOk());
        byte[] chargeback = payload(checkout, profile.userId(), "evt-stale-chargeback", "provider-tx-stale",
            PaymentEventType.PAYMENT_CHARGEBACK, paidAt.plusSeconds(120));
        webhook(chargeback, sign(chargeback)).andExpect(status().isOk());
        byte[] olderPaid = payload(checkout, profile.userId(), "evt-stale-replay", "provider-tx-stale",
            PaymentEventType.PAYMENT_PAID, paidAt.plusSeconds(60));
        webhook(olderPaid, sign(olderPaid)).andExpect(status().isOk());

        assertThat(transactionRepository.findById(checkout.transactionId()).orElseThrow().getStatus())
            .isEqualTo(PaymentStatus.CHARGEBACK);
        assertThat(userRepository.findById(profile.userId()).orElseThrow().getIsPremium()).isFalse();
    }

    @Test
    void refundFinalStateRejectsNewerPaidReplayAndDuplicateRefund() throws Exception {
        Profile profile = profile("refund-order@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
        Instant at = Instant.parse("2026-09-06T10:00:00Z");
        byte[] paid = payload(checkout, profile.userId(), "evt-order-paid", "provider-tx-order",
            PaymentEventType.PAYMENT_PAID, at);
        byte[] refund = payload(checkout, profile.userId(), "evt-order-refund", "provider-tx-order",
            PaymentEventType.PAYMENT_REFUNDED, at.plusSeconds(10));
        byte[] replayedPaid = payload(checkout, profile.userId(), "evt-order-paid-replay", "provider-tx-order",
            PaymentEventType.PAYMENT_PAID, at.plusSeconds(20));

        webhook(paid, sign(paid)).andExpect(status().isOk());
        webhook(refund, sign(refund)).andExpect(status().isOk());
        webhook(refund, sign(refund)).andExpect(status().isOk()).andExpect(jsonPath("$.duplicate").value(true));
        webhook(replayedPaid, sign(replayedPaid)).andExpect(status().isOk());

        assertThat(transactionRepository.findById(checkout.transactionId()).orElseThrow().getStatus())
            .isEqualTo(PaymentStatus.REFUNDED);
        assertThat(userRepository.findById(profile.userId()).orElseThrow().getIsPremium()).isFalse();
    }

    @Test
    @Timeout(15)
    void concurrentPaidEventsCannotDoubleGrantCapacity() throws Exception {
        Profile profile = profile("concurrent-payment@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.CAPACITY_100);
        Instant at = Instant.parse("2026-09-06T10:00:00Z");
        byte[] first = payload(checkout, profile.userId(), "evt-concurrent-a", "provider-tx-concurrent",
            PaymentEventType.PAYMENT_PAID, at);
        byte[] second = payload(checkout, profile.userId(), "evt-concurrent-b", "provider-tx-concurrent",
            PaymentEventType.PAYMENT_PAID, at.plusSeconds(1));
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            var a = pool.submit(() -> concurrentWebhook(first, ready, start));
            var b = pool.submit(() -> concurrentWebhook(second, ready, start));
            ready.await();
            start.countDown();
            assertThat(java.util.List.of(a.get(), b.get())).containsOnly(200);
        } finally {
            pool.shutdownNow();
        }

        assertThat(userRepository.findById(profile.userId()).orElseThrow().getPurchasedExtraCapacity())
            .isEqualTo(100);
        assertThat(transactionRepository.findById(checkout.transactionId()).orElseThrow().getStatus())
            .isEqualTo(PaymentStatus.PAID);
    }

    @Test
    void providerTransactionIdCannotBeReusedForAnotherCheckout() throws Exception {
        Profile first = profile("provider-id-a@example.com");
        Profile second = profile("provider-id-b@example.com");
        Checkout firstCheckout = createCheckout(first, PaymentProductCatalog.SEENLY_PLUS);
        Checkout secondCheckout = createCheckout(second, PaymentProductCatalog.SEENLY_PLUS);
        Instant at = Instant.parse("2026-09-06T10:00:00Z");
        byte[] firstPaid = payload(firstCheckout, first.userId(), "evt-provider-id-a", "provider-tx-unique", PaymentEventType.PAYMENT_PAID, at);
        webhook(firstPaid, sign(firstPaid)).andExpect(status().isOk());
        byte[] duplicateReference = payload(secondCheckout, second.userId(), "evt-provider-id-b", "provider-tx-unique", PaymentEventType.PAYMENT_PAID, at.plusSeconds(1));
        webhook(duplicateReference, sign(duplicateReference)).andExpect(status().isBadRequest());

        assertThat(userRepository.findById(second.userId()).orElseThrow().getIsPremium()).isFalse();
        assertThat(transactionRepository.findById(secondCheckout.transactionId()).orElseThrow().getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    @Test
    void databaseFailureRollsBackEntitlementAndLedgerState() throws Exception {
        Profile profile = profile("rollback@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
        byte[] paid = payload(checkout, profile.userId(), "evt-rollback", "provider-tx-rollback",
            PaymentEventType.PAYMENT_PAID, Instant.parse("2026-09-06T10:00:00Z"));
        doThrow(new DataIntegrityViolationException("simulated event ledger failure"))
            .when(eventRepository).saveAndFlush(any(PaymentProviderEvent.class));

        webhook(paid, sign(paid)).andExpect(status().isConflict());
        reset(eventRepository);

        assertThat(userRepository.findById(profile.userId()).orElseThrow().getIsPremium()).isFalse();
        PaymentTransaction transaction = transactionRepository.findById(checkout.transactionId()).orElseThrow();
        assertThat(transaction.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(transaction.getEntitlementGrantedAt()).isNull();
        assertThat(eventRepository.count()).isZero();

        webhook(paid, sign(paid)).andExpect(status().isOk());
        assertThat(userRepository.findById(profile.userId()).orElseThrow().getIsPremium()).isTrue();
        assertThat(transactionRepository.findById(checkout.transactionId()).orElseThrow().getStatus())
            .isEqualTo(PaymentStatus.PAID);
        assertThat(eventRepository.count()).isEqualTo(1);
    }

    @Test
    void paymentMetricsTrackEntitlementDuplicateAndRefundWithoutSensitiveLabelsOrLogs() throws Exception {
        Profile profile = profile("observability-payment@example.com");
        Checkout checkout = createCheckout(profile, PaymentProductCatalog.SEENLY_PLUS);
        Instant paidAt = Instant.parse("2026-09-06T10:00:00Z");
        byte[] paid = payload(checkout, profile.userId(), "evt-observe-paid", "provider-observe-paid",
            PaymentEventType.PAYMENT_PAID, paidAt);
        String signature = sign(paid);
        Logger root = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        root.addAppender(appender);
        try {
            double grants = metric("seenly.payment.entitlements", "type", "PLUS", "outcome", "success");
            double duplicates = metric("seenly.payment.webhooks", "event_type", "PAYMENT_PAID", "outcome", "duplicate");
            double refunds = metric("seenly.payment.webhooks", "event_type", "PAYMENT_REFUNDED", "outcome", "accepted");
            webhook(paid, signature).andExpect(status().isOk());
            webhook(paid, signature).andExpect(status().isOk()).andExpect(jsonPath("$.duplicate").value(true));
            byte[] refund = payload(checkout, profile.userId(), "evt-observe-refund", "provider-observe-paid",
                PaymentEventType.PAYMENT_REFUNDED, paidAt.plusSeconds(30));
            webhook(refund, sign(refund)).andExpect(status().isOk());

            assertThat(metric("seenly.payment.entitlements", "type", "PLUS", "outcome", "success"))
                .isEqualTo(grants + 1);
            assertThat(metric("seenly.payment.webhooks", "event_type", "PAYMENT_PAID", "outcome", "duplicate"))
                .isEqualTo(duplicates + 1);
            assertThat(metric("seenly.payment.webhooks", "event_type", "PAYMENT_REFUNDED", "outcome", "accepted"))
                .isEqualTo(refunds + 1);
            String logs = appender.list.stream().map(e -> e.getFormattedMessage() + e.getMDCPropertyMap())
                .reduce("", (a, b) -> a + "\n" + b);
            assertThat(logs).doesNotContain(signature, new String(paid, StandardCharsets.UTF_8), profile.token());
            meterRegistry.getMeters().forEach(meter -> meter.getId().getTags().forEach(tag ->
                assertThat(tag.getValue()).doesNotContain(profile.userId().toString(), checkout.transactionId().toString(),
                    profile.token(), "observability-payment@example.com")));
        } finally {
            root.detachAppender(appender);
        }
    }

    private double metric(String name, String... tags) {
        var counter = meterRegistry.find(name).tags(tags).counter();
        return counter == null ? 0 : counter.count();
    }

    private org.springframework.test.web.servlet.ResultActions checkout(Profile profile, String productCode) throws Exception {
        return mockMvc.perform(post("/api/billing/checkouts")
            .header("X-Owner-Token", profile.token())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsBytes(Map.of("productCode", productCode))));
    }

    private Checkout createCheckout(Profile profile, String productCode) throws Exception {
        String body = checkout(profile, productCode).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(body);
        return new Checkout(UUID.fromString(json.get("transactionId").asText()),
            json.get("providerCheckoutId").asText(), json.get("status").asText());
    }

    private org.springframework.test.web.servlet.ResultActions webhook(byte[] payload, String signature) throws Exception {
        var request = post("/api/billing/webhooks/test-hmac")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload);
        if (signature != null) request.header("X-Payment-Signature", signature);
        return mockMvc.perform(request);
    }

    private int concurrentWebhook(byte[] payload, CountDownLatch ready, CountDownLatch start) throws Exception {
        ready.countDown();
        start.await();
        return webhook(payload, sign(payload)).andReturn().getResponse().getStatus();
    }

    private byte[] payload(Checkout checkout, UUID ownerId, String eventId, String providerTransactionId,
                           PaymentEventType type, Instant occurredAt) throws Exception {
        PaymentTransaction transaction = transactionRepository.findById(checkout.transactionId()).orElseThrow();
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("eventId", eventId);
        event.put("type", type);
        event.put("providerTransactionId", providerTransactionId);
        event.put("providerCheckoutId", checkout.providerCheckoutId());
        event.put("internalTransactionId", checkout.transactionId());
        event.put("ownerAccountId", ownerId);
        event.put("productCode", transaction.getProductCode());
        event.put("amountMinor", transaction.getAmountMinor());
        event.put("currency", transaction.getCurrency());
        event.put("occurredAt", occurredAt);
        return objectMapper.writeValueAsBytes(event);
    }

    private String sign(byte[] payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(payload));
    }

    private Profile profile(String email) {
        User user = userRepository.saveAndFlush(User.builder().email(email).emailVerified(true).build());
        String token = tokenHashingService.generateRawToken();
        Seenly seenly = seenlyRepository.saveAndFlush(Seenly.builder()
            .user(user)
            .email(email)
            .displayName("Payment Owner")
            .publicSlug(tokenHashingService.generatePublicSlug())
            .ownerTokenHash(tokenHashingService.hashToken(token))
            .ownerTokenExpiresAt(Instant.now().plusSeconds(3600))
            .build());
        return new Profile(token, user.getId(), seenly.getId());
    }

    private record Profile(String token, UUID userId, UUID seenlyId) { }
    private record Checkout(UUID transactionId, String providerCheckoutId, String status) { }
}
