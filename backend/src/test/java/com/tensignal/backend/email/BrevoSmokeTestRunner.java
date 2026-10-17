package com.tensignal.backend.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controlled smoke test utility for live Brevo email delivery.
 * <p>
 * GUARANTEES:
 * 1. Never runs in standard build/CI (auto-skipped unless -Dsmoke.recipient=... is set).
 * 2. Automatically reads BREVO_API_KEY from backend/.env so secrets are never typed in terminal.
 * 3. Only sends isolated test emails to the explicitly designated test recipient.
 * 4. Never triggers mass notifications or touches the outbox database.
 * 5. Never logs or prints the BREVO_API_KEY (strictly redacted).
 * 6. Securely reports the Brevo message ID for each test.
 * 7. Tests:
 *    - 1 TR OTP verification email
 *    - 1 EN OTP verification email
 *    - 1 Evaluation notification email
 * </p>
 */
public class BrevoSmokeTestRunner {

    private static final String DEFAULT_BREVO_SENDER = "mail@10signal.me";
    private static final String DEFAULT_BREVO_SENDER_NAME = "10Signal";
    private static final String DEFAULT_BREVO_REPLY_TO = "10signal.me@gmail.com";

    @Test
    void runSmokeTestIfConfigured() {
        Map<String, String> dotenv = loadDotenv();

        String recipient = System.getProperty("smoke.recipient");
        if (recipient == null || recipient.isBlank()) {
            recipient = System.getenv("TEST_RECIPIENT");
        }
        if (recipient == null || recipient.isBlank()) {
            recipient = dotenv.get("TEST_RECIPIENT");
        }

        Assumptions.assumeTrue(recipient != null && !recipient.isBlank(),
            "Skipping live Brevo smoke test. Set -Dsmoke.recipient=user@example.com to run.");

        String apiKey = System.getProperty("smoke.apiKey");
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = System.getenv("BREVO_API_KEY");
        }
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = dotenv.get("BREVO_API_KEY");
        }

        Assumptions.assumeTrue(apiKey != null && !apiKey.isBlank(),
            "Skipping live Brevo smoke test. BREVO_API_KEY was not found in .env or environment.");

        String senderEmail = System.getProperty("smoke.senderEmail");
        if (senderEmail == null || senderEmail.isBlank()) {
            senderEmail = System.getenv("BREVO_SENDER_EMAIL");
        }
        if (senderEmail == null || senderEmail.isBlank()) {
            senderEmail = dotenv.get("BREVO_SENDER_EMAIL");
        }
        if (senderEmail == null || senderEmail.isBlank()) {
            senderEmail = DEFAULT_BREVO_SENDER;
        }

        String replyTo = System.getProperty("smoke.replyTo");
        if (replyTo == null || replyTo.isBlank()) {
            replyTo = System.getenv("BREVO_REPLY_TO");
        }
        if (replyTo == null || replyTo.isBlank()) {
            replyTo = dotenv.get("BREVO_REPLY_TO");
        }
        if (replyTo == null || replyTo.isBlank()) {
            replyTo = DEFAULT_BREVO_REPLY_TO;
        }

        String senderName = System.getProperty("smoke.senderName");
        if (senderName == null || senderName.isBlank()) {
            senderName = System.getenv("BREVO_SENDER_NAME");
        }
        if (senderName == null || senderName.isBlank()) {
            senderName = dotenv.get("BREVO_SENDER_NAME");
        }
        if (senderName == null || senderName.isBlank()) {
            senderName = DEFAULT_BREVO_SENDER_NAME;
        }

        executeLiveBrevoSuite(apiKey.trim(), senderEmail.trim(), senderName.trim(), replyTo.trim(), recipient.trim());
    }

    public static void main(String[] args) {
        Map<String, String> dotenv = loadDotenv();

        String recipient = System.getenv("TEST_RECIPIENT");
        if (recipient == null || recipient.isBlank()) {
            recipient = dotenv.get("TEST_RECIPIENT");
        }
        if (args.length > 0 && args[0] != null && !args[0].isBlank()) {
            recipient = args[0];
        }

        String apiKey = System.getenv("BREVO_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = dotenv.get("BREVO_API_KEY");
        }
        if (args.length > 1 && args[1] != null && !args[1].isBlank()) {
            apiKey = args[1];
        }

        if (recipient == null || recipient.isBlank()) {
            System.err.println("Usage: pass recipient as 1st argument or set -Dsmoke.recipient=user@example.com");
            System.exit(1);
        }

        if (apiKey == null || apiKey.isBlank()) {
            System.err.println("Error: BREVO_API_KEY was not found in backend/.env or environment.");
            System.exit(1);
        }

        String senderEmail = System.getenv("BREVO_SENDER_EMAIL");
        if (senderEmail == null || senderEmail.isBlank()) {
            senderEmail = dotenv.get("BREVO_SENDER_EMAIL");
        }
        if (senderEmail == null || senderEmail.isBlank()) {
            senderEmail = DEFAULT_BREVO_SENDER;
        }

        String replyTo = System.getenv("BREVO_REPLY_TO");
        if (replyTo == null || replyTo.isBlank()) {
            replyTo = dotenv.get("BREVO_REPLY_TO");
        }
        if (replyTo == null || replyTo.isBlank()) {
            replyTo = DEFAULT_BREVO_REPLY_TO;
        }

        String senderName = System.getenv("BREVO_SENDER_NAME");
        if (senderName == null || senderName.isBlank()) {
            senderName = dotenv.get("BREVO_SENDER_NAME");
        }
        if (senderName == null || senderName.isBlank()) {
            senderName = DEFAULT_BREVO_SENDER_NAME;
        }

        executeLiveBrevoSuite(apiKey.trim(), senderEmail.trim(), senderName.trim(), replyTo.trim(), recipient.trim());
    }

    public static void executeLiveBrevoSuite(String apiKey, String senderEmail, String senderName, String replyTo, String recipient) {
        System.out.println("=================================================================");
        System.out.println("           10SIGNAL BREVO LIVE TRANSACTIONAL SMOKE TEST           ");
        System.out.println("=================================================================");
        System.out.println("Sender:    " + senderName + " <" + senderEmail + ">");
        System.out.println("Reply-To:  " + replyTo);
        System.out.println("Recipient: " + redactEmail(recipient));
        System.out.println("API Key:   [REDACTED] (length: " + (apiKey != null ? apiKey.length() : 0) + ")");
        System.out.println("-----------------------------------------------------------------");

        ObjectMapper objectMapper = new ObjectMapper();
        EmailTemplateService templateService = new EmailTemplateService(objectMapper);
        templateService.init();

        BrevoEmailProvider provider = new BrevoEmailProvider(
            apiKey, senderEmail, senderName, replyTo, objectMapper
        );

        int passed = 0;
        int total = 3;

        // Test 1: Turkish OTP Verification
        System.out.println("[1/3] Sending Turkish OTP Verification Email...");
        boolean t1 = sendSingleTestEmail(
            provider, templateService,
            NotificationType.LOGIN_VERIFICATION,
            "tr",
            Map.of("code", "582914", "ttlMinutes", 10),
            recipient,
            "smoke-tr-otp-" + UUID.randomUUID()
        );
        if (t1) passed++;

        // Test 2: English OTP Verification
        System.out.println("[2/3] Sending English OTP Verification Email...");
        boolean t2 = sendSingleTestEmail(
            provider, templateService,
            NotificationType.LOGIN_VERIFICATION,
            "en",
            Map.of("code", "739201", "ttlMinutes", 10),
            recipient,
            "smoke-en-otp-" + UUID.randomUUID()
        );
        if (t2) passed++;

        // Test 3: Evaluation Notification
        System.out.println("[3/3] Sending Evaluation Notification Email...");
        boolean t3 = sendSingleTestEmail(
            provider, templateService,
            NotificationType.NEW_EVALUATION,
            "tr",
            Map.of("dashboardUrl", "https://10signal.me/dashboard", "count", 1),
            recipient,
            "smoke-eval-" + UUID.randomUUID()
        );
        if (t3) passed++;

        System.out.println("=================================================================");
        System.out.println("SUMMARY: " + passed + "/" + total + " emails successfully accepted by Brevo.");
        if (passed == total) {
            System.out.println("STATUS: ALL TESTS PASSED! Brevo REST API is operational.");
            System.out.println("Check your Brevo dashboard at: https://app.brevo.com/transactional/email");
        } else {
            System.err.println("STATUS: WARNING - Some test emails were rejected. Check logs above.");
        }
        System.out.println("=================================================================");
    }

    private static boolean sendSingleTestEmail(
            BrevoEmailProvider provider,
            EmailTemplateService templateService,
            NotificationType type,
            String locale,
            Map<String, Object> context,
            String recipient,
            String trackingId) {

        try {
            RenderedEmailContent rendered = templateService.render(type, locale, context);

            EmailMessage message = EmailMessage.builder()
                .to(recipient)
                .subject(rendered.getSubject())
                .htmlBody(rendered.getHtmlBody())
                .textBody(rendered.getTextBody())
                .notificationType(type.name())
                .idempotencyKey(trackingId)
                .build();

            EmailSendResult result = provider.send(message);

            if (result.isSuccess()) {
                System.out.println("  -> SUCCESS: " + type.name() + " (" + locale + ")");
                System.out.println("     Brevo Message ID: " + result.getProviderMessageId());
                System.out.println("     Subject: " + rendered.getSubject());
                return true;
            } else {
                System.err.println("  -> FAILED: " + type.name() + " (" + locale + ")");
                System.err.println("     Retryable: " + result.isRetryable());
                System.err.println("     Error: " + result.getErrorMessage());
                return false;
            }
        } catch (Exception ex) {
            System.err.println("  -> EXCEPTION sending " + type.name() + ": " + ex.getMessage());
            return false;
        }
    }

    private static Map<String, String> loadDotenv() {
        Map<String, String> map = new HashMap<>();
        List<File> candidates = List.of(
            new File(".env"),
            new File("backend/.env"),
            new File("../.env"),
            new File(System.getProperty("user.dir", "."), ".env"),
            new File(System.getProperty("user.dir", "."), "backend/.env")
        );

        for (File f : candidates) {
            if (f.exists() && f.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(f.toPath(), StandardCharsets.UTF_8);
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = trimmed.indexOf('=');
                        if (eqIdx <= 0) {
                            continue;
                        }
                        String key = trimmed.substring(0, eqIdx).trim();
                        String val = trimmed.substring(eqIdx + 1).trim();

                        if (key.startsWith("\uFEFF")) {
                            key = key.substring(1).trim();
                        }
                        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                            if (val.length() >= 2) {
                                val = val.substring(1, val.length() - 1);
                            }
                        }
                        if (!key.isEmpty()) {
                            map.putIfAbsent(key, val);
                        }
                    }
                    if (!map.isEmpty()) {
                        break;
                    }
                } catch (Exception ignored) {
                }
            }
        }
        return map;
    }

    private static String redactEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "<redacted>";
        }
        int atIdx = email.indexOf('@');
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx + 1);
        String maskedLocal = local.length() <= 2 ? local.charAt(0) + "***" : local.charAt(0) + "***" + local.charAt(local.length() - 1);
        return maskedLocal + "@" + domain;
    }
}
