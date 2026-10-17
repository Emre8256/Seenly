package com.tensignal.backend.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.config.PaymentProperties;
import com.tensignal.backend.exception.InvalidPaymentEventException;
import com.tensignal.backend.exception.InvalidPaymentSignatureException;
import com.tensignal.backend.exception.PaymentProviderUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LemonSqueezyPaymentProviderTest {

    private ObjectMapper objectMapper;
    private PaymentProperties properties;
    private LemonSqueezyPaymentProvider provider;

    private static final String TEST_SECRET = "lemon_test_secret_12345";
    private static final String TEST_URL_PLUS = "https://seenly.lemonsqueezy.com/checkout/buy/c31e5d1b-a28d-46b1-99e1-6ec637c927da";
    private static final String TEST_URL_100 = "https://seenly.lemonsqueezy.com/checkout/buy/9e4aa985-a2dc-46da-a20a-246bc2d9e83c";
    private static final String TEST_URL_250 = "https://seenly.lemonsqueezy.com/checkout/buy/90f059cc-bd69-487a-9acf-f4f2f5d6c42b";
    private static final String TEST_URL_500 = "https://seenly.lemonsqueezy.com/checkout/buy/06107728-bcbb-42fa-b72e-3d7120db82ba";

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        properties = new PaymentProperties();
        properties.getLemonSqueezy().setWebhookSecret(TEST_SECRET);
        properties.getLemonSqueezy().setPlusCheckoutUrl(TEST_URL_PLUS);
        properties.getLemonSqueezy().setCapacity100CheckoutUrl(TEST_URL_100);
        properties.getLemonSqueezy().setCapacity250CheckoutUrl(TEST_URL_250);
        properties.getLemonSqueezy().setCapacity500CheckoutUrl(TEST_URL_500);
        provider = new LemonSqueezyPaymentProvider(objectMapper, properties);
    }

    @Test
    void testProviderCode() {
        assertThat(provider.providerCode()).isEqualTo("lemonsqueezy");
    }

    @Test
    void testCreateCheckoutSuccessfulForTenSignalPlus() {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();
        PaymentProduct product = new PaymentProduct("seenly_plus_v1", EntitlementType.PLUS, 0, 399, "USD", true);

        ProviderCheckoutRequest request = new ProviderCheckoutRequest(transactionId, ownerAccountId, product);
        ProviderCheckout checkout = provider.createCheckout(request);

        assertThat(checkout).isNotNull();
        assertThat(checkout.providerCheckoutId()).isEqualTo("ls_chk_" + transactionId);

        String url = checkout.checkoutUrl();
        assertThat(url).startsWith(TEST_URL_PLUS);

        String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8);
        assertThat(decodedUrl).contains("checkout[custom][transaction_id]=" + transactionId);
        assertThat(decodedUrl).contains("checkout[custom][owner_account_id]=" + ownerAccountId);
        assertThat(decodedUrl).contains("checkout[custom][product_code]=seenly_plus_v1");
        assertThat(decodedUrl).contains("checkout[custom][checkout_id]=ls_chk_" + transactionId);
    }

    @Test
    void testCreateCheckoutSuccessfulForCapacity100() {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();
        PaymentProduct product = new PaymentProduct("response_capacity_100_v1", EntitlementType.RESPONSE_CAPACITY, 100, 99, "USD", true);

        ProviderCheckoutRequest request = new ProviderCheckoutRequest(transactionId, ownerAccountId, product);
        ProviderCheckout checkout = provider.createCheckout(request);

        assertThat(checkout).isNotNull();
        assertThat(checkout.providerCheckoutId()).isEqualTo("ls_chk_" + transactionId);

        String url = checkout.checkoutUrl();
        assertThat(url).startsWith(TEST_URL_100);

        String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8);
        assertThat(decodedUrl).contains("checkout[custom][transaction_id]=" + transactionId);
        assertThat(decodedUrl).contains("checkout[custom][owner_account_id]=" + ownerAccountId);
        assertThat(decodedUrl).contains("checkout[custom][product_code]=response_capacity_100_v1");
        assertThat(decodedUrl).contains("checkout[custom][checkout_id]=ls_chk_" + transactionId);
    }

    @Test
    void testCreateCheckoutSuccessfulForCapacity250() {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();
        PaymentProduct product = new PaymentProduct("response_capacity_250_v1", EntitlementType.RESPONSE_CAPACITY, 250, 199, "USD", true);

        ProviderCheckoutRequest request = new ProviderCheckoutRequest(transactionId, ownerAccountId, product);
        ProviderCheckout checkout = provider.createCheckout(request);

        assertThat(checkout).isNotNull();
        assertThat(checkout.providerCheckoutId()).isEqualTo("ls_chk_" + transactionId);

        String url = checkout.checkoutUrl();
        assertThat(url).startsWith(TEST_URL_250);

        String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8);
        assertThat(decodedUrl).contains("checkout[custom][transaction_id]=" + transactionId);
        assertThat(decodedUrl).contains("checkout[custom][owner_account_id]=" + ownerAccountId);
        assertThat(decodedUrl).contains("checkout[custom][product_code]=response_capacity_250_v1");
        assertThat(decodedUrl).contains("checkout[custom][checkout_id]=ls_chk_" + transactionId);
    }

    @Test
    void testCreateCheckoutSuccessfulForCapacity500() {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();
        PaymentProduct product = new PaymentProduct("response_capacity_500_v1", EntitlementType.RESPONSE_CAPACITY, 500, 399, "USD", true);

        ProviderCheckoutRequest request = new ProviderCheckoutRequest(transactionId, ownerAccountId, product);
        ProviderCheckout checkout = provider.createCheckout(request);

        assertThat(checkout).isNotNull();
        assertThat(checkout.providerCheckoutId()).isEqualTo("ls_chk_" + transactionId);

        String url = checkout.checkoutUrl();
        assertThat(url).startsWith(TEST_URL_500);

        String decodedUrl = URLDecoder.decode(url, StandardCharsets.UTF_8);
        assertThat(decodedUrl).contains("checkout[custom][transaction_id]=" + transactionId);
        assertThat(decodedUrl).contains("checkout[custom][owner_account_id]=" + ownerAccountId);
        assertThat(decodedUrl).contains("checkout[custom][product_code]=response_capacity_500_v1");
        assertThat(decodedUrl).contains("checkout[custom][checkout_id]=ls_chk_" + transactionId);
    }

    @Test
    void testCreateCheckoutRejectsUnsupportedProducts() {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();
        PaymentProduct product = new PaymentProduct("unknown_mystery_plan", EntitlementType.RESPONSE_CAPACITY, 999, 9999, "USD", true);

        ProviderCheckoutRequest request = new ProviderCheckoutRequest(transactionId, ownerAccountId, product);
        assertThatThrownBy(() -> provider.createCheckout(request))
            .isInstanceOf(PaymentProviderUnavailableException.class)
            .hasMessageContaining("not supported by Lemon Squeezy provider");
    }

    @Test
    void testCreateCheckoutFailsIfUrlNotConfigured() {
        properties.getLemonSqueezy().setCapacity100CheckoutUrl("");
        PaymentProduct product = new PaymentProduct("response_capacity_100_v1", EntitlementType.RESPONSE_CAPACITY, 100, 99, "USD", true);
        ProviderCheckoutRequest request = new ProviderCheckoutRequest(UUID.randomUUID(), UUID.randomUUID(), product);

        assertThatThrownBy(() -> provider.createCheckout(request))
            .isInstanceOf(PaymentProviderUnavailableException.class)
            .hasMessageContaining("is not configured");
    }

    @Test
    void testVerifyAndParseWebhookValidOrderCreated() throws Exception {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();

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
                "id": "1001",
                "type": "orders",
                "attributes": {
                  "identifier": "ord_1001",
                  "order_number": 1001,
                  "status": "paid",
                  "total": 399,
                  "currency": "USD",
                  "created_at": "2026-09-15T12:00:00Z"
                }
              }
            }
            """.formatted(transactionId, ownerAccountId, transactionId);

        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String signature = computeHmacHex(TEST_SECRET, payloadBytes);

        VerifiedPaymentEvent event = provider.verifyAndParseWebhook(signature, payloadBytes);

        assertThat(event).isNotNull();
        assertThat(event.type()).isEqualTo(PaymentEventType.PAYMENT_PAID);
        assertThat(event.providerTransactionId()).isEqualTo("1001");
        assertThat(event.providerCheckoutId()).isEqualTo("ls_chk_" + transactionId);
        assertThat(event.internalTransactionId()).isEqualTo(transactionId);
        assertThat(event.ownerAccountId()).isEqualTo(ownerAccountId);
        assertThat(event.productCode()).isEqualTo("seenly_plus_v1");
        assertThat(event.amountMinor()).isEqualTo(399L);
        assertThat(event.currency()).isEqualTo("USD");
        assertThat(event.eventId()).isEqualTo("ls:order_created:1001");
    }

    @Test
    void testVerifyAndParseWebhookOrderRefunded() throws Exception {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();

        String payload = """
            {
              "meta": {
                "event_name": "order_refunded",
                "custom_data": {
                  "transaction_id": "%s",
                  "owner_account_id": "%s",
                  "product_code": "seenly_plus_v1",
                  "checkout_id": "ls_chk_%s"
                }
              },
              "data": {
                "id": "1002",
                "type": "orders",
                "attributes": {
                  "identifier": "ord_1002",
                  "status": "refunded",
                  "total": 399,
                  "currency": "USD",
                  "created_at": "2026-09-15T12:05:00Z"
                }
              }
            }
            """.formatted(transactionId, ownerAccountId, transactionId);

        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String signature = computeHmacHex(TEST_SECRET, payloadBytes);

        VerifiedPaymentEvent event = provider.verifyAndParseWebhook(signature, payloadBytes);

        assertThat(event.type()).isEqualTo(PaymentEventType.PAYMENT_REFUNDED);
        assertThat(event.eventId()).isEqualTo("ls:order_refunded:1002");
    }

    @Test
    void testVerifyAndParseWebhookChargeback() throws Exception {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();

        String payload = """
            {
              "meta": {
                "event_name": "order_chargeback",
                "custom_data": {
                  "transaction_id": "%s",
                  "owner_account_id": "%s",
                  "product_code": "seenly_plus_v1",
                  "checkout_id": "ls_chk_%s"
                }
              },
              "data": {
                "id": "1003",
                "type": "orders",
                "attributes": {
                  "identifier": "ord_1003",
                  "status": "chargeback",
                  "total": 399,
                  "currency": "USD",
                  "created_at": "2026-09-15T12:10:00Z"
                }
              }
            }
            """.formatted(transactionId, ownerAccountId, transactionId);

        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String signature = computeHmacHex(TEST_SECRET, payloadBytes);

        VerifiedPaymentEvent event = provider.verifyAndParseWebhook(signature, payloadBytes);

        assertThat(event.type()).isEqualTo(PaymentEventType.PAYMENT_CHARGEBACK);
    }

    @Test
    void testVerifyAndParseWebhookInvalidSignatureThrowsException() {
        byte[] payloadBytes = "{}".getBytes(StandardCharsets.UTF_8);
        String invalidSignature = "deadbeef12345678";

        assertThatThrownBy(() -> provider.verifyAndParseWebhook(invalidSignature, payloadBytes))
            .isInstanceOf(InvalidPaymentSignatureException.class);
    }

    @Test
    void testVerifyAndParseWebhookMissingSignatureThrowsException() {
        byte[] payloadBytes = "{}".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> provider.verifyAndParseWebhook(null, payloadBytes))
            .isInstanceOf(InvalidPaymentSignatureException.class);
        assertThatThrownBy(() -> provider.verifyAndParseWebhook("", payloadBytes))
            .isInstanceOf(InvalidPaymentSignatureException.class);
    }

    @Test
    void testVerifyAndParseWebhookMissingSecretThrowsException() {
        properties.getLemonSqueezy().setWebhookSecret("");
        byte[] payloadBytes = "{}".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> provider.verifyAndParseWebhook("sig", payloadBytes))
            .isInstanceOf(PaymentProviderUnavailableException.class)
            .hasMessageContaining("webhook secret is not configured");
    }

    @Test
    void testVerifyAndParseWebhookMissingCustomDataThrowsException() {
        String payload = """
            {
              "meta": {
                "event_name": "order_created",
                "custom_data": {}
              },
              "data": {
                "id": "1004",
                "type": "orders",
                "attributes": { "status": "paid", "total": 399, "currency": "USD" }
              }
            }
            """;
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String signature = computeHmacHex(TEST_SECRET, payloadBytes);

        assertThatThrownBy(() -> provider.verifyAndParseWebhook(signature, payloadBytes))
            .isInstanceOf(InvalidPaymentEventException.class)
            .hasMessageContaining("missing required transaction metadata");
    }

    @Test
    void testVerifyAndParseWebhookUnknownEventSafelyIgnored() {
        String payload = """
            {
              "meta": {
                "event_name": "subscription_created"
              },
              "data": {
                "id": "sub_999",
                "type": "subscriptions",
                "attributes": { "status": "active" }
              }
            }
            """;
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String signature = computeHmacHex(TEST_SECRET, payloadBytes);

        VerifiedPaymentEvent event = provider.verifyAndParseWebhook(signature, payloadBytes);

        assertThat(event).isNotNull();
        assertThat(event.isIgnored()).isTrue();
        assertThat(event.type()).isNull();
        assertThat(event.eventId()).contains("subscription_created");
    }

    @Test
    void testVerifyAndParseWebhookOrderCreatedPendingSafelyIgnored() {
        UUID transactionId = UUID.randomUUID();
        UUID ownerAccountId = UUID.randomUUID();
        String payload = """
            {
              "meta": {
                "event_name": "order_created",
                "custom_data": {
                  "transaction_id": "%s",
                  "owner_account_id": "%s",
                  "product_code": "seenly_plus_v1"
                }
              },
              "data": {
                "id": "1005",
                "type": "orders",
                "attributes": { "status": "pending", "total": 399, "currency": "USD" }
              }
            }
            """.formatted(transactionId, ownerAccountId);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
        String signature = computeHmacHex(TEST_SECRET, payloadBytes);

        VerifiedPaymentEvent event = provider.verifyAndParseWebhook(signature, payloadBytes);

        assertThat(event).isNotNull();
        assertThat(event.isIgnored()).isTrue();
        assertThat(event.type()).isNull();
    }

    private String computeHmacHex(String secret, byte[] payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
