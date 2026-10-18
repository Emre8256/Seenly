package com.tensignal.backend.email;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.entity.EmailOutboxEntity;
import com.tensignal.backend.entity.EmailOutboxStatus;
import com.tensignal.backend.observability.ApplicationMetrics;
import com.tensignal.backend.observability.AuditLogService;
import com.tensignal.backend.repository.EmailOutboxRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BrevoEmailProviderTest {

    private static final String TEST_API_KEY = "xkeysib-test-mock-api-key-123456789";
    private static final String TEST_SENDER_EMAIL = "mail@10signal.me";
    private static final String TEST_SENDER_NAME = "10Signal";
    private static final String TEST_REPLY_TO = "10signal.me@gmail.com";

    private ObjectMapper objectMapper;
    private EmailTemplateService templateService;
    private OtpPayloadCryptoService cryptoService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        templateService = new EmailTemplateService(objectMapper);
        templateService.init();
        cryptoService = new OtpPayloadCryptoService("test-crypto-secret-key-for-unit-tests-256", objectMapper);
    }

    @Test
    @DisplayName("1. BREVO_API_KEY mevcut -> Brevo provider doğru varsayılanlarla oluşturuluyor")
    void testBrevoProviderCreationWithApiKey() {
        BrevoEmailProvider provider = new BrevoEmailProvider(
            TEST_API_KEY,
            TEST_SENDER_EMAIL,
            TEST_SENDER_NAME,
            TEST_REPLY_TO,
            objectMapper
        );

        assertThat(provider).isNotNull();
        assertThat(provider.getProviderId()).isEqualTo("brevo");
        assertThat(provider.getSenderEmail()).isEqualTo("mail@10signal.me");
        assertThat(provider.getSenderName()).isEqualTo("10Signal");
        assertThat(provider.getDefaultReplyTo()).isEqualTo("10signal.me@gmail.com");
    }

    @Test
    @DisplayName("2. API key eksik veya boş -> hızlı fail ediyor")
    void testMissingApiKeyFailsFast() {
        assertThatThrownBy(() -> new BrevoEmailProvider(null, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("BREVO_API_KEY must not be null or blank");

        assertThatThrownBy(() -> new BrevoEmailProvider("   ", TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("BREVO_API_KEY must not be null or blank");
    }

    @Test
    @DisplayName("3. Başarılı HTTP 201 yanıtı -> messageId döner ve success=true olur")
    void testSuccessfulSendReturnsBrevoMessageId() {
        String expectedMessageId = "<202610171200.abcdef123456@smtp-relay.brevo.com>";
        String brevoResponseBody = "{\"messageId\":\"" + expectedMessageId + "\"}";

        BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) ->
            new BrevoEmailProvider.BrevoRawResponse(201, brevoResponseBody);

        BrevoEmailProvider provider = new BrevoEmailProvider(
            mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailMessage message = EmailMessage.builder()
            .to("user@example.com")
            .subject("Giriş Doğrulama Kodu")
            .htmlBody("<p>Doğrulama kodunuz: 123456</p>")
            .textBody("Doğrulama kodunuz: 123456")
            .notificationType("LOGIN_VERIFICATION")
            .idempotencyKey("otp-login-12345")
            .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getProviderMessageId()).isEqualTo(expectedMessageId);
        assertThat(result.isDisabled()).isFalse();
        assertThat(result.isRetryable()).isFalse();
    }

    @Test
    @DisplayName("4. Alternatif JSON formatı (messageIds dizisi) başarıyla parse edilir")
    void testSuccessfulSendWithAlternativeJsonFormat() {
        String expectedMessageId = "<alt-id-987654@smtp-relay.brevo.com>";
        String brevoResponseBody = "{\"messageIds\":[\"" + expectedMessageId + "\"]}";

        BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) ->
            new BrevoEmailProvider.BrevoRawResponse(200, brevoResponseBody);

        BrevoEmailProvider provider = new BrevoEmailProvider(
            mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailMessage message = EmailMessage.builder()
            .to("user@example.com")
            .subject("Bildirim")
            .htmlBody("<p>Test</p>")
            .textBody("Test")
            .notificationType("NEW_EVALUATION")
            .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getProviderMessageId()).isEqualTo(expectedMessageId);
    }

    @Test
    @DisplayName("5. Brevo JSON payload kontratı tam doğrulanır (sender, to, replyTo, headers, tags)")
    void testBrevoPayloadMatchesExpectedRestApiContract() throws Exception {
        AtomicReference<String> capturedEndpoint = new AtomicReference<>();
        AtomicReference<String> capturedApiKey = new AtomicReference<>();
        AtomicReference<String> capturedPayload = new AtomicReference<>();

        BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) -> {
            capturedEndpoint.set(endpoint);
            capturedApiKey.set(apiKey);
            capturedPayload.set(jsonPayload);
            return new BrevoEmailProvider.BrevoRawResponse(201, "{\"messageId\":\"<msg-001@brevo.com>\"}");
        };

        BrevoEmailProvider provider = new BrevoEmailProvider(
            mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailMessage message = EmailMessage.builder()
            .to("target.user@domain.com")
            .subject("Hesap Güvenlik Bildirimi")
            .htmlBody("<h1>Güvenlik Bildirimi</h1>")
            .textBody("Güvenlik Bildirimi")
            .notificationType("EMAIL_CHANGED")
            .idempotencyKey("email-changed-tx-777")
            .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isTrue();
        assertThat(capturedEndpoint.get()).isEqualTo(BrevoEmailProvider.DEFAULT_API_URL);
        assertThat(capturedApiKey.get()).isEqualTo(TEST_API_KEY);

        Map<String, Object> payloadMap = objectMapper.readValue(
            capturedPayload.get(), new TypeReference<Map<String, Object>>() {}
        );

        // Sender
        @SuppressWarnings("unchecked")
        Map<String, Object> senderMap = (Map<String, Object>) payloadMap.get("sender");
        assertThat(senderMap).isNotNull();
        assertThat(senderMap.get("name")).isEqualTo("10Signal");
        assertThat(senderMap.get("email")).isEqualTo("mail@10signal.me");

        // To
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> toList = (List<Map<String, Object>>) payloadMap.get("to");
        assertThat(toList).hasSize(1);
        assertThat(toList.get(0).get("email")).isEqualTo("target.user@domain.com");

        // Reply-To
        @SuppressWarnings("unchecked")
        Map<String, Object> replyToMap = (Map<String, Object>) payloadMap.get("replyTo");
        assertThat(replyToMap).isNotNull();
        assertThat(replyToMap.get("email")).isEqualTo("10signal.me@gmail.com");

        // Subject & Bodies
        assertThat(payloadMap.get("subject")).isEqualTo("Hesap Güvenlik Bildirimi");
        assertThat(payloadMap.get("htmlContent")).isEqualTo("<h1>Güvenlik Bildirimi</h1>");
        assertThat(payloadMap.get("textContent")).isEqualTo("Güvenlik Bildirimi");

        // Headers
        @SuppressWarnings("unchecked")
        Map<String, Object> headersMap = (Map<String, Object>) payloadMap.get("headers");
        assertThat(headersMap).isNotNull();
        assertThat(headersMap.get("X-Notification-Type")).isEqualTo("EMAIL_CHANGED");
        assertThat(headersMap.get("X-Entity-Ref-ID")).isEqualTo("email-changed-tx-777");

        // Tags
        @SuppressWarnings("unchecked")
        List<String> tagsList = (List<String>) payloadMap.get("tags");
        assertThat(tagsList).containsExactly("email_changed");
    }

    @Test
    @DisplayName("6. Özel reply-to adresi mesaja verilirse varsayılanın yerine geçer")
    void testCustomReplyToOverride() throws Exception {
        AtomicReference<String> capturedPayload = new AtomicReference<>();

        BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) -> {
            capturedPayload.set(jsonPayload);
            return new BrevoEmailProvider.BrevoRawResponse(201, "{\"messageId\":\"<msg-custom-reply@brevo.com>\"}");
        };

        BrevoEmailProvider provider = new BrevoEmailProvider(
            mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailMessage message = EmailMessage.builder()
            .to("user@example.com")
            .subject("Özel Yanıt Başlığı")
            .htmlBody("<p>Merhaba</p>")
            .textBody("Merhaba")
            .notificationType("FIRST_SHARE_REMINDER")
            .replyTo("custom.support@10signal.me")
            .build();

        provider.send(message);

        Map<String, Object> payloadMap = objectMapper.readValue(
            capturedPayload.get(), new TypeReference<Map<String, Object>>() {}
        );
        @SuppressWarnings("unchecked")
        Map<String, Object> replyToMap = (Map<String, Object>) payloadMap.get("replyTo");
        assertThat(replyToMap.get("email")).isEqualTo("custom.support@10signal.me");
    }

    @Test
    @DisplayName("7. HTTP 401 Unauthorized -> Kalıcı hata (retryable=false), API anahtarı gizlenir")
    void testInvalidApiKey401PermanentFailure() {
        String errorJson = "{\"code\":\"unauthorized\",\"message\":\"Key not found: " + TEST_API_KEY + "\"}";

        BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) ->
            new BrevoEmailProvider.BrevoRawResponse(401, errorJson);

        BrevoEmailProvider provider = new BrevoEmailProvider(
            mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailMessage message = EmailMessage.builder()
            .to("user@example.com")
            .subject("Test")
            .htmlBody("<p>Test</p>")
            .textBody("Test")
            .notificationType("LOGIN_VERIFICATION")
            .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isFalse();
        assertThat(result.getErrorMessage()).contains("401");
        assertThat(result.getErrorMessage()).doesNotContain(TEST_API_KEY);
        assertThat(result.getErrorMessage()).contains("[REDACTED_API_KEY]");
    }

    @Test
    @DisplayName("8. HTTP 403 Forbidden -> Kalıcı hata (retryable=false)")
    void testForbidden403PermanentFailure() {
        String errorJson = "{\"code\":\"permission_denied\",\"message\":\"Transactional email access not allowed\"}";

        BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) ->
            new BrevoEmailProvider.BrevoRawResponse(403, errorJson);

        BrevoEmailProvider provider = new BrevoEmailProvider(
            mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailMessage message = EmailMessage.builder()
            .to("user@example.com")
            .subject("Test")
            .htmlBody("<p>Test</p>")
            .textBody("Test")
            .notificationType("NEW_EVALUATION")
            .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isFalse();
        assertThat(result.getErrorMessage()).contains("403");
    }

    @Test
    @DisplayName("9. HTTP 429 Rate Limit -> Geçici hata (retryable=true)")
    void testRateLimit429RetryableFailure() {
        String errorJson = "{\"code\":\"too_many_requests\",\"message\":\"Daily transactional rate limit exceeded\"}";

        BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) ->
            new BrevoEmailProvider.BrevoRawResponse(429, errorJson);

        BrevoEmailProvider provider = new BrevoEmailProvider(
            mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailMessage message = EmailMessage.builder()
            .to("user@example.com")
            .subject("Test")
            .htmlBody("<p>Test</p>")
            .textBody("Test")
            .notificationType("NEW_EVALUATION")
            .build();

        EmailSendResult result = provider.send(message);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.isRetryable()).isTrue();
        assertThat(result.getErrorMessage()).contains("429");
    }

    @Test
    @DisplayName("10. HTTP 5xx Sunucu Hataları (500, 502, 503) -> Geçici hata (retryable=true)")
    void testServerErrors5xxRetryableFailure() {
        int[] serverErrorCodes = {500, 502, 503, 504};

        for (int code : serverErrorCodes) {
            BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) ->
                new BrevoEmailProvider.BrevoRawResponse(code, "{\"error\":\"Service Unavailable\"}");

            BrevoEmailProvider provider = new BrevoEmailProvider(
                mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
            );

            EmailMessage message = EmailMessage.builder()
                .to("user@example.com")
                .subject("Test")
                .htmlBody("<p>Test</p>")
                .textBody("Test")
                .notificationType("NEW_EVALUATION")
                .build();

            EmailSendResult result = provider.send(message);

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.isRetryable())
                .as("Status code " + code + " must be retryable")
                .isTrue();
        }
    }

    @Test
    @DisplayName("11. HTTP 400 ve 422 İstemci Hataları -> Kalıcı hata (retryable=false)")
    void testClientErrors400And422PermanentFailure() {
        int[] clientErrorCodes = {400, 404, 422};

        for (int code : clientErrorCodes) {
            BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) ->
                new BrevoEmailProvider.BrevoRawResponse(code, "{\"code\":\"invalid_parameter\",\"message\":\"Bad format\"}");

            BrevoEmailProvider provider = new BrevoEmailProvider(
                mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
            );

            EmailMessage message = EmailMessage.builder()
                .to("user@example.com")
                .subject("Test")
                .htmlBody("<p>Test</p>")
                .textBody("Test")
                .notificationType("NEW_EVALUATION")
                .build();

            EmailSendResult result = provider.send(message);

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.isRetryable())
                .as("Status code " + code + " must be permanent / terminal")
                .isFalse();
        }
    }

    @Test
    @DisplayName("12. SocketTimeoutException ve ConnectException -> Geçici hata (retryable=true)")
    void testNetworkExceptionsAreRetryable() {
        // SocketTimeoutException
        BrevoEmailProvider.BrevoClientWrapper timeoutClient = (endpoint, apiKey, jsonPayload) -> {
            throw new SocketTimeoutException("Read timed out after 10000ms");
        };

        BrevoEmailProvider timeoutProvider = new BrevoEmailProvider(
            timeoutClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailMessage message = EmailMessage.builder()
            .to("user@example.com")
            .subject("Test")
            .htmlBody("<p>Test</p>")
            .textBody("Test")
            .notificationType("LOGIN_VERIFICATION")
            .build();

        EmailSendResult timeoutResult = timeoutProvider.send(message);
        assertThat(timeoutResult.isSuccess()).isFalse();
        assertThat(timeoutResult.isRetryable()).isTrue();

        // ConnectException
        BrevoEmailProvider.BrevoClientWrapper connectClient = (endpoint, apiKey, jsonPayload) -> {
            throw new ConnectException("Connection refused");
        };

        BrevoEmailProvider connectProvider = new BrevoEmailProvider(
            connectClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailSendResult connectResult = connectProvider.send(message);
        assertThat(connectResult.isSuccess()).isFalse();
        assertThat(connectResult.isRetryable()).isTrue();

        // HttpTimeoutException
        BrevoEmailProvider.BrevoClientWrapper httpTimeoutClient = (endpoint, apiKey, jsonPayload) -> {
            throw new HttpTimeoutException("request timed out");
        };

        BrevoEmailProvider httpTimeoutProvider = new BrevoEmailProvider(
            httpTimeoutClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailSendResult httpTimeoutResult = httpTimeoutProvider.send(message);
        assertThat(httpTimeoutResult.isSuccess()).isFalse();
        assertThat(httpTimeoutResult.isRetryable()).isTrue();
    }

    @Test
    @DisplayName("13. Sıkı API Key ve Secret Maskeleme Kontrolü")
    void testSecretRedactionSanitizer() {
        BrevoEmailProvider provider = new BrevoEmailProvider(
            (endpoint, apiKey, jsonPayload) -> new BrevoEmailProvider.BrevoRawResponse(201, "{}"),
            "xkeysib-supersecretkey999",
            TEST_SENDER_EMAIL,
            TEST_SENDER_NAME,
            TEST_REPLY_TO,
            objectMapper
        );

        String rawError = "Error with xkeysib-supersecretkey999 and another token xkeysib-otherkey123456";
        String sanitized = provider.sanitizeErrorMessage(rawError, 500);

        assertThat(sanitized).doesNotContain("xkeysib-supersecretkey999");
        assertThat(sanitized).doesNotContain("xkeysib-otherkey123456");
        assertThat(sanitized).contains("[REDACTED_API_KEY]");
        assertThat(sanitized).contains("[REDACTED_SECRET]");
    }

    @Test
    @DisplayName("14. EmailMessage CRLF Header Injection girişimlerini reddeder")
    void testCrlfInjectionRejected() {
        assertThatThrownBy(() -> EmailMessage.builder()
            .to("victim@example.com\r\nBcc: attacker@evil.com")
            .subject("Subject")
            .htmlBody("<p>Hi</p>")
            .textBody("Hi")
            .notificationType("LOGIN_VERIFICATION")
            .build())
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Header injection rejected");

        assertThatThrownBy(() -> EmailMessage.builder()
            .to("victim@example.com")
            .subject("Subject\r\nInjected-Header: value")
            .htmlBody("<p>Hi</p>")
            .textBody("Hi")
            .notificationType("LOGIN_VERIFICATION")
            .build())
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Header injection rejected");
    }

    @Test
    @DisplayName("15. EmailOutboxWorker Brevo ile başarılı gönderimde outbox kaydını SENT yapar ve Brevo messageId saklar")
    void testOutboxWorkerIntegrationWithBrevoSuccess() {
        EmailOutboxRepository outboxRepo = mock(EmailOutboxRepository.class);
        ApplicationMetrics metrics = mock(ApplicationMetrics.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        Clock clock = Clock.fixed(Instant.parse("2026-10-17T12:00:00Z"), ZoneId.of("UTC"));

        String brevoId = "<brevo-tx-outbox-success-12345@smtp.brevo.com>";
        BrevoEmailProvider.BrevoClientWrapper mockClient = (endpoint, apiKey, jsonPayload) ->
            new BrevoEmailProvider.BrevoRawResponse(201, "{\"messageId\":\"" + brevoId + "\"}");

        BrevoEmailProvider brevoProvider = new BrevoEmailProvider(
            mockClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailOutboxWorker worker = new EmailOutboxWorker(
            outboxRepo, brevoProvider, templateService, cryptoService,
            mock(TenSignalRepository.class), metrics, auditLogService, objectMapper, clock
        );

        UUID itemId = UUID.randomUUID();
        EmailOutboxEntity entity = EmailOutboxEntity.builder()
            .id(itemId)
            .recipient("user@10signal.me")
            .recipientHash("dummyhash")
            .notificationType(NotificationType.LOGIN_VERIFICATION.name())
            .locale("tr")
            .payloadJson(cryptoService.encryptPayload(Map.of("code", "582914", "ttlMinutes", 10)))
            .status(EmailOutboxStatus.PENDING)
            .attempts(0)
            .maxAttempts(5)
            .createdAt(clock.instant())
            .nextAttemptAt(clock.instant())
            .expiresAt(clock.instant().plus(Duration.ofMinutes(10)))
            .build();

        worker.processItemInternal(entity);

        assertThat(entity.getStatus()).isEqualTo(EmailOutboxStatus.SENT);
        assertThat(entity.getProviderMessageId()).isEqualTo(brevoId);
        assertThat(entity.getSentAt()).isEqualTo(clock.instant());
        verify(outboxRepo, atLeastOnce()).save(entity);
        verify(metrics).emailSent(NotificationType.LOGIN_VERIFICATION.name());
    }

    @Test
    @DisplayName("16. EmailOutboxWorker Brevo geçici hatasında (429) retry ve backoff planlar")
    void testOutboxWorkerHandlesBrevoTransientFailureWithRetry() {
        EmailOutboxRepository outboxRepo = mock(EmailOutboxRepository.class);
        ApplicationMetrics metrics = mock(ApplicationMetrics.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        Clock clock = Clock.fixed(Instant.parse("2026-10-17T12:00:00Z"), ZoneId.of("UTC"));

        BrevoEmailProvider.BrevoClientWrapper rateLimitedClient = (endpoint, apiKey, jsonPayload) ->
            new BrevoEmailProvider.BrevoRawResponse(429, "{\"code\":\"too_many_requests\",\"message\":\"Rate limit\"}");

        BrevoEmailProvider brevoProvider = new BrevoEmailProvider(
            rateLimitedClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailOutboxWorker worker = new EmailOutboxWorker(
            outboxRepo, brevoProvider, templateService, cryptoService,
            mock(TenSignalRepository.class), metrics, auditLogService, objectMapper, clock
        );

        EmailOutboxEntity entity = EmailOutboxEntity.builder()
            .id(UUID.randomUUID())
            .recipient("user@10signal.me")
            .recipientHash("dummyhash")
            .notificationType(NotificationType.NEW_EVALUATION.name())
            .locale("tr")
            .payloadJson(objectMapper.valueToTree(Map.of("dashboardUrl", "https://tensignal.me/dashboard")).toString())
            .status(EmailOutboxStatus.PENDING)
            .attempts(0)
            .maxAttempts(5)
            .createdAt(clock.instant())
            .nextAttemptAt(clock.instant())
            .build();

        worker.processItemInternal(entity);

        assertThat(entity.getStatus()).isEqualTo(EmailOutboxStatus.PENDING);
        assertThat(entity.getAttempts()).isEqualTo(1);
        assertThat(entity.getNextAttemptAt()).isEqualTo(clock.instant().plus(Duration.ofMinutes(1)));
        verify(outboxRepo, atLeastOnce()).save(entity);
        verify(metrics).emailRetry(NotificationType.NEW_EVALUATION.name());
    }

    @Test
    @DisplayName("17. EmailOutboxWorker Brevo kalıcı hatasında (401) derhal FAILED yapar, tekrar denemez")
    void testOutboxWorkerHandlesBrevoPermanentFailureWithoutRetry() {
        EmailOutboxRepository outboxRepo = mock(EmailOutboxRepository.class);
        ApplicationMetrics metrics = mock(ApplicationMetrics.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        Clock clock = Clock.fixed(Instant.parse("2026-10-17T12:00:00Z"), ZoneId.of("UTC"));

        BrevoEmailProvider.BrevoClientWrapper unauthorizedClient = (endpoint, apiKey, jsonPayload) ->
            new BrevoEmailProvider.BrevoRawResponse(401, "{\"code\":\"unauthorized\",\"message\":\"Key not found\"}");

        BrevoEmailProvider brevoProvider = new BrevoEmailProvider(
            unauthorizedClient, TEST_API_KEY, TEST_SENDER_EMAIL, TEST_SENDER_NAME, TEST_REPLY_TO, objectMapper
        );

        EmailOutboxWorker worker = new EmailOutboxWorker(
            outboxRepo, brevoProvider, templateService, cryptoService,
            mock(TenSignalRepository.class), metrics, auditLogService, objectMapper, clock
        );

        EmailOutboxEntity entity = EmailOutboxEntity.builder()
            .id(UUID.randomUUID())
            .recipient("user@10signal.me")
            .recipientHash("dummyhash")
            .notificationType(NotificationType.LOGIN_VERIFICATION.name())
            .locale("tr")
            .payloadJson(cryptoService.encryptPayload(Map.of("code", "582914", "ttlMinutes", 10)))
            .status(EmailOutboxStatus.PENDING)
            .attempts(0)
            .maxAttempts(5)
            .createdAt(clock.instant())
            .nextAttemptAt(clock.instant())
            .build();

        worker.processItemInternal(entity);

        assertThat(entity.getStatus()).isEqualTo(EmailOutboxStatus.FAILED);
        assertThat(entity.getAttempts()).isEqualTo(1);
        verify(outboxRepo, atLeastOnce()).save(entity);
        verify(metrics).emailFailed(NotificationType.LOGIN_VERIFICATION.name());
    }

    @Test
    @DisplayName("18. Türkçe OTP ve hesap güvenliği e-posta şablonu Brevo için eksiksiz render edilir")
    void testTurkishOtpEmailRendering() {
        RenderedEmailContent rendered = templateService.render(
            NotificationType.LOGIN_VERIFICATION,
            "tr",
            Map.of("code", "582914", "ttlMinutes", 10)
        );

        assertThat(rendered.getSubject()).contains("10Signal");
        assertThat(rendered.getSubject()).contains("giriş doğrulama kodunuz");
        assertThat(rendered.getHtmlBody()).contains("Giriş Doğrulama Kodu");
        assertThat(rendered.getHtmlBody()).contains("582914");
        assertThat(rendered.getHtmlBody()).contains("10Signal");
        assertThat(rendered.getTextBody()).contains("582914");
        assertThat(rendered.getHtmlBody()).contains("lang=\"tr\"");
    }

    @Test
    @DisplayName("19. İngilizce OTP ve hesap güvenliği e-posta şablonu Brevo için eksiksiz render edilir")
    void testEnglishOtpEmailRendering() {
        RenderedEmailContent rendered = templateService.render(
            NotificationType.LOGIN_VERIFICATION,
            "en",
            Map.of("code", "739201", "ttlMinutes", 10)
        );

        assertThat(rendered.getSubject()).contains("Your 10Signal login verification code");
        assertThat(rendered.getHtmlBody()).contains("Login Verification Code");
        assertThat(rendered.getHtmlBody()).contains("739201");
        assertThat(rendered.getHtmlBody()).contains("10Signal");
        assertThat(rendered.getTextBody()).contains("739201");
        assertThat(rendered.getHtmlBody()).contains("lang=\"en\"");
    }

    @Test
    @DisplayName("20. Değerlendirme bildirimleri (NEW_EVALUATION) şablonu doğru hazırlanır")
    void testEvaluationNotificationRendering() {
        RenderedEmailContent renderedTr = templateService.render(
            NotificationType.NEW_EVALUATION,
            "tr",
            Map.of("dashboardUrl", "https://10signal.me", "count", 3)
        );

        assertThat(renderedTr.getSubject()).isNotBlank();
        assertThat(renderedTr.getHtmlBody()).contains("https://10signal.me");

        RenderedEmailContent renderedEn = templateService.render(
            NotificationType.NEW_EVALUATION,
            "en",
            Map.of("dashboardUrl", "https://10signal.me", "count", 1)
        );

        assertThat(renderedEn.getSubject()).isNotBlank();
        assertThat(renderedEn.getHtmlBody()).contains("https://10signal.me");
    }

    @Test
    @DisplayName("21. Brevo email provider gönderici ve reply-to varsayılanları doğrulanır")
    void testBrevoDefaultProperties() {
        BrevoEmailProvider provider = new BrevoEmailProvider(
            TEST_API_KEY,
            "mail@10signal.me",
            "10Signal",
            "10signal.me@gmail.com",
            objectMapper
        );

        assertThat(provider.getProviderId()).isEqualTo("brevo");
        assertThat(provider.getSenderEmail()).isEqualTo("mail@10signal.me");
        assertThat(provider.getSenderName()).isEqualTo("10Signal");
        assertThat(provider.getDefaultReplyTo()).isEqualTo("10signal.me@gmail.com");
    }
}
