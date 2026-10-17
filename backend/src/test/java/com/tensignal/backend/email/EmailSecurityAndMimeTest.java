package com.tensignal.backend.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Map;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class EmailSecurityAndMimeTest {

    private EmailTemplateService templateService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        templateService = new EmailTemplateService(objectMapper);
        templateService.init();
    }

    @Test
    @DisplayName("1. Disabled provider network call yapmıyor")
    void testDisabledProviderMakesZeroNetworkCalls() {
        DisabledEmailProvider provider = new DisabledEmailProvider();
        EmailMessage message = EmailMessage.builder()
            .to("test@example.com")
            .subject("Hello")
            .htmlBody("<p>Hello</p>")
            .textBody("Hello")
            .notificationType("LOGIN_VERIFICATION")
            .build();

        EmailSendResult result = provider.send(message);
        assertThat(result.isDisabled()).isTrue();
        assertThat(result.isSuccess()).isTrue();
        assertThat(provider.getProviderId()).isEqualTo("disabled");
    }

    @Test
    @DisplayName("2. SMTP MIME oluşturuyor")
    void testSmtpMimeCreation() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        Session session = Session.getInstance(new Properties());
        MimeMessage mimeMessage = new MimeMessage(session);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        SmtpEmailProvider provider = new SmtpEmailProvider(mailSender, "no-reply@tensignal.app");
        EmailMessage message = EmailMessage.builder()
            .to("recipient@example.com")
            .subject("Test Subject")
            .htmlBody("<h1>Hello HTML</h1>")
            .textBody("Hello Text")
            .notificationType("REPORT_UNLOCKED")
            .build();

        EmailSendResult result = provider.send(message);
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getProviderMessageId()).isNotNull();

        verify(mailSender, times(1)).send(mimeMessage);
        assertThat(mimeMessage.getHeader("X-Notification-Type")[0]).isEqualTo("REPORT_UNLOCKED");
        assertThat(mimeMessage.getSubject()).isEqualTo("Test Subject");
    }

    @Test
    @DisplayName("3. CRLF injection engelleniyor")
    void testCrlfInjectionProtection() {
        // CRLF in to
        assertThatThrownBy(() -> EmailMessage.builder()
            .to("victim@example.com\r\nBcc: attacker@example.com")
            .subject("Valid Subject")
            .htmlBody("<p>hi</p>")
            .textBody("hi")
            .notificationType("TEST")
            .build()
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Header injection rejected");

        // CRLF in subject
        assertThatThrownBy(() -> EmailMessage.builder()
            .to("victim@example.com")
            .subject("Subject\nInjection")
            .htmlBody("<p>hi</p>")
            .textBody("hi")
            .notificationType("TEST")
            .build()
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Header injection rejected");

        // CRLF in replyTo
        assertThatThrownBy(() -> EmailMessage.builder()
            .to("victim@example.com")
            .subject("Subject")
            .replyTo("attacker@example.com\r\n")
            .htmlBody("<p>hi</p>")
            .textBody("hi")
            .notificationType("TEST")
            .build()
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Header injection rejected");
    }

    @Test
    @DisplayName("4. TR template rendering")
    void testTrTemplateRendering() {
        RenderedEmailContent content = templateService.render(
            NotificationType.REPORT_UNLOCKED,
            "tr",
            Map.of("dashboardUrl", "https://tensignal.app/dashboard")
        );

        assertThat(content.getSubject()).contains("Raporunuz Açıldı");
        assertThat(content.getHtmlBody()).contains("10Signal");
        assertThat(content.getHtmlBody()).contains("https://tensignal.app/dashboard");
        assertThat(content.getTextBody()).contains("3 değerlendirme tamamlandı");
    }

    @Test
    @DisplayName("5. EN template rendering & no subscription terminology in Plus welcome")
    void testEnTemplateRendering() {
        RenderedEmailContent content = templateService.render(
            NotificationType.PLUS_WELCOME,
            "en",
            Map.of("dashboardUrl", "https://tensignal.app/dashboard")
        );

        assertThat(content.getSubject()).isEqualTo("Welcome to 10Signal Plus!");
        assertThat(content.getHtmlBody()).contains("one-time purchase");
        // CRITICAL: Ensure no subscription terminology is present!
        assertThat(content.getHtmlBody().toLowerCase()).doesNotContain("subscription");
        assertThat(content.getTextBody().toLowerCase()).doesNotContain("subscription");
        assertThat(content.getTextBody()).contains("one-time purchase");
    }

    @Test
    @DisplayName("6. Locale fallback")
    void testLocaleFallback() {
        // Regional prefix: tr-TR -> tr
        assertThat(templateService.resolveLocale("tr-TR")).isEqualTo("tr");
        // Unknown locale: de -> en (canonical fallback)
        assertThat(templateService.resolveLocale("de")).isEqualTo("en");
        assertThat(templateService.resolveLocale("fr-FR")).isEqualTo("en");

        RenderedEmailContent content = templateService.render(
            NotificationType.REPORT_UNLOCKED,
            "de",
            Map.of("dashboardUrl", "https://tensignal.app/dashboard")
        );
        assertThat(content.getSubject()).contains("Outside Report is Unlocked");
    }

    @Test
    @DisplayName("7. HTML escaping prevents XSS")
    void testHtmlEscaping() {
        RenderedEmailContent content = templateService.render(
            NotificationType.NEW_EVALUATION,
            "en",
            Map.of("count", "<script>alert('xss')</script>")
        );

        assertThat(content.getHtmlBody()).doesNotContain("<script>");
        assertThat(content.getHtmlBody()).contains("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    }

    @Test
    @DisplayName("8. Plain text generation")
    void testPlainTextGeneration() {
        RenderedEmailContent content = templateService.render(
            NotificationType.NEW_EVALUATION,
            "en",
            Map.of("count", 5, "dashboardUrl", "https://tensignal.app/dashboard")
        );

        assertThat(content.getTextBody()).contains("5 new anonymous evaluations");
        assertThat(content.getTextBody()).contains("https://tensignal.app/dashboard");
    }

    @Test
    @DisplayName("32. No sensitive data in logs")
    void testNoSensitiveDataInLogs() {
        EmailMessage message = EmailMessage.builder()
            .to("secret_user@example.com")
            .subject("Verification Code")
            .htmlBody("<p>Code: 1234</p>")
            .textBody("Code: 1234")
            .notificationType("LOGIN_VERIFICATION")
            .build();

        String str = message.toString();
        assertThat(str).doesNotContain("secret_user@example.com");
        assertThat(str).contains("to=<redacted>");
        assertThat(str).doesNotContain("1234");
    }

    @Test
    @DisplayName("Verify all 14 NotificationTypes render in TR and EN and can be processed by FakeEmailProvider")
    void testAllFourteenNotificationTypesRenderSuccessfullyWithFakeProvider() {
        class FakeEmailProvider implements EmailSender {
            final java.util.List<EmailMessage> inbox = new java.util.ArrayList<>();
            @Override
            public EmailSendResult send(EmailMessage message) {
                inbox.add(message);
                return EmailSendResult.success("fake-" + inbox.size());
            }
            @Override
            public String getProviderId() { return "fake"; }
        }

        FakeEmailProvider fakeProvider = new FakeEmailProvider();
        Map<String, Object> sampleParams = Map.ofEntries(
            Map.entry("code", "9876"),
            Map.entry("count", 3),
            Map.entry("currentResponses", 8),
            Map.entry("maxCapacity", 10),
            Map.entry("shareUrl", "https://tensignal.app/p/test"),
            Map.entry("dashboardUrl", "https://tensignal.app/dashboard"),
            Map.entry("upgradeUrl", "https://tensignal.app/pricing"),
            Map.entry("securityUrl", "https://tensignal.app/settings/security"),
            Map.entry("homeUrl", "https://tensignal.app"),
            Map.entry("loginUrl", "https://tensignal.app/auth/login"),
            Map.entry("registerUrl", "https://tensignal.app/auth/register"),
            Map.entry("product", "TenSignal Plus"),
            Map.entry("amount", "199.00"),
            Map.entry("currency", "TRY"),
            Map.entry("reference", "REF-12345"),
            Map.entry("timestamp", "2026-09-11 12:00")
        );

        NotificationType[] allTypes = NotificationType.values();
        assertThat(allTypes).hasSize(14);

        for (NotificationType type : allTypes) {
            // Render TR
            RenderedEmailContent trRender = templateService.render(type, "tr", sampleParams);
            assertThat(trRender.getSubject()).as("TR subject for " + type).isNotBlank();
            assertThat(trRender.getHtmlBody()).as("TR HTML for " + type).isNotBlank();
            assertThat(trRender.getTextBody()).as("TR Text for " + type).isNotBlank();

            // Render EN
            RenderedEmailContent enRender = templateService.render(type, "en", sampleParams);
            assertThat(enRender.getSubject()).as("EN subject for " + type).isNotBlank();
            assertThat(enRender.getHtmlBody()).as("EN HTML for " + type).isNotBlank();
            assertThat(enRender.getTextBody()).as("EN Text for " + type).isNotBlank();

            // Send to FakeEmailProvider
            EmailMessage msg = EmailMessage.builder()
                .to("recipient@example.com")
                .subject(trRender.getSubject())
                .htmlBody(trRender.getHtmlBody())
                .textBody(trRender.getTextBody())
                .notificationType(type.name())
                .build();
            EmailSendResult res = fakeProvider.send(msg);
            assertThat(res.isSuccess()).isTrue();
        }

        assertThat(fakeProvider.inbox).hasSize(14);
    }
}
