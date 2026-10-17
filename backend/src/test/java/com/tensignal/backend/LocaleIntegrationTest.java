package com.tensignal.backend;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tensignal.backend.constant.OtpPurpose;
import com.tensignal.backend.dto.UpdateLocaleRequest;
import com.tensignal.backend.email.*;
import com.tensignal.backend.entity.EmailOutboxEntity;
import com.tensignal.backend.entity.EmailOutboxStatus;
import com.tensignal.backend.entity.TenSignal;
import com.tensignal.backend.entity.User;
import com.tensignal.backend.repository.EmailOutboxRepository;
import com.tensignal.backend.repository.TenSignalRepository;
import com.tensignal.backend.repository.UserRepository;
import com.tensignal.backend.service.AuthService;
import com.tensignal.backend.service.TenSignalService;
import com.tensignal.backend.service.TokenHashingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LocaleIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private EmailOutboxRepository outboxRepository;
    @Autowired private TenSignalRepository tenSignalRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AuthService authService;
    @Autowired private TenSignalService tenSignalService;
    @Autowired private EmailTemplateService templateService;
    @Autowired private EmailNotificationService notificationService;
    @Autowired private OtpPayloadCryptoService cryptoService;
    @Autowired private TokenHashingService tokenHashingService;
    @Autowired private Clock clock;

    @BeforeEach
    void setUp() {
        outboxRepository.deleteAll();
    }

    @Test
    @DisplayName("12.D: Anonymous visitor with locale=tr receives Turkish OTP")
    void anonymousOtpWithTurkishLocale() throws Exception {
        String email = "tr-anon@example.com";
        authService.sendVerificationCode(email, OtpPurpose.REGISTER, null, "tr");

        List<EmailOutboxEntity> mails = outboxRepository.findAll();
        assertThat(mails).hasSize(1);
        EmailOutboxEntity mail = mails.get(0);
        assertThat(mail.getLocale()).isEqualTo("tr");

        Map<String, Object> payload = cryptoService.decryptPayload(mail.getPayloadJson());
        RenderedEmailContent rendered = templateService.render(NotificationType.valueOf(mail.getNotificationType()), mail.getLocale(), payload);
        assertThat(rendered.getSubject()).contains("kayıt doğrulama kodunuz");
        assertThat(rendered.getHtmlBody()).contains("doğrulama kodunuz");
        assertThat(rendered.getHtmlBody()).contains("<html lang=\"tr\"");
    }

    @Test
    @DisplayName("12.D: Anonymous visitor with locale=en receives English OTP")
    void anonymousOtpWithEnglishLocale() throws Exception {
        String email = "en-anon@example.com";
        authService.sendVerificationCode(email, OtpPurpose.REGISTER, null, "en");

        List<EmailOutboxEntity> mails = outboxRepository.findAll();
        assertThat(mails).hasSize(1);
        EmailOutboxEntity mail = mails.get(0);
        assertThat(mail.getLocale()).isEqualTo("en");

        Map<String, Object> payload = cryptoService.decryptPayload(mail.getPayloadJson());
        RenderedEmailContent rendered = templateService.render(NotificationType.valueOf(mail.getNotificationType()), mail.getLocale(), payload);
        assertThat(rendered.getSubject()).contains("registration code");
        assertThat(rendered.getHtmlBody()).contains("verification code");
        assertThat(rendered.getHtmlBody()).contains("<html lang=\"en\"");
    }

    @Test
    @DisplayName("12.D: Anonymous visitor with unsupported/null locale falls back to English OTP")
    void anonymousOtpWithInvalidLocaleFallsBackToEnglish() throws Exception {
        String email = "de-anon@example.com";
        authService.sendVerificationCode(email, OtpPurpose.REGISTER, null, "de");

        List<EmailOutboxEntity> mails = outboxRepository.findAll();
        assertThat(mails).hasSize(1);
        EmailOutboxEntity mail = mails.get(0);
        assertThat(mail.getLocale()).isEqualTo("en");

        Map<String, Object> payload = cryptoService.decryptPayload(mail.getPayloadJson());
        RenderedEmailContent rendered = templateService.render(NotificationType.valueOf(mail.getNotificationType()), mail.getLocale(), payload);
        assertThat(rendered.getSubject()).contains("registration code");
        assertThat(rendered.getHtmlBody()).contains("<html lang=\"en\"");
    }

    @Test
    @DisplayName("12.D: Account preferredLocale=en takes precedence over requested Turkish locale on login")
    void accountPreferredLocaleWinsOnLogin() throws Exception {
        String email = "english-user@example.com";
        User user = userRepository.save(User.builder()
                .email(email)
                .preferredLocale("en")
                .build());
        tenSignalRepository.save(TenSignal.builder()
                .displayName("English User")
                .email(email)
                .user(user)
                .publicSlug("en-user-123")
                .ownerTokenHash(tokenHashingService.hashToken("raw-en-token"))
                .ownerTokenExpiresAt(clock.instant().plus(Duration.ofHours(24)))
                .preferredLocale("en")
                .build());

        // Client sends tr, but account preferredLocale is en -> must send English OTP
        authService.sendVerificationCode(email, OtpPurpose.LOGIN, null, "tr");

        List<EmailOutboxEntity> mails = outboxRepository.findAll();
        assertThat(mails).hasSize(1);
        EmailOutboxEntity mail = mails.get(0);
        assertThat(mail.getLocale()).isEqualTo("en");

        Map<String, Object> payload = cryptoService.decryptPayload(mail.getPayloadJson());
        RenderedEmailContent rendered = templateService.render(NotificationType.valueOf(mail.getNotificationType()), mail.getLocale(), payload);
        assertThat(rendered.getSubject()).contains("login verification code");
    }

    @Test
    @DisplayName("12.D: Account preferredLocale=tr takes precedence over requested English locale on login")
    void accountPreferredLocaleTrWinsOnLogin() throws Exception {
        String email = "turkish-user@example.com";
        User user = userRepository.save(User.builder()
                .email(email)
                .preferredLocale("tr")
                .build());
        tenSignalRepository.save(TenSignal.builder()
                .displayName("Turkish User")
                .email(email)
                .user(user)
                .publicSlug("tr-user-123")
                .ownerTokenHash(tokenHashingService.hashToken("raw-tr-token"))
                .ownerTokenExpiresAt(clock.instant().plus(Duration.ofHours(24)))
                .preferredLocale("tr")
                .build());

        // Client sends en, but account preferredLocale is tr -> must send Turkish OTP
        authService.sendVerificationCode(email, OtpPurpose.LOGIN, null, "en");

        List<EmailOutboxEntity> mails = outboxRepository.findAll();
        assertThat(mails).hasSize(1);
        EmailOutboxEntity mail = mails.get(0);
        assertThat(mail.getLocale()).isEqualTo("tr");

        Map<String, Object> payload = cryptoService.decryptPayload(mail.getPayloadJson());
        RenderedEmailContent rendered = templateService.render(NotificationType.valueOf(mail.getNotificationType()), mail.getLocale(), payload);
        assertThat(rendered.getSubject()).contains("giriş doğrulama kodunuz");
    }

    @Test
    @DisplayName("12.C: PUT /api/v1/tensignal/owner/locale successfully updates preferredLocale in PostgreSQL")
    void updateOwnerLocaleEndpoint() throws Exception {
        String rawToken = "test-locale-token-123";
        User user = userRepository.save(User.builder()
                .email("sync@example.com")
                .preferredLocale("tr")
                .build());
        TenSignal tenSignal = tenSignalRepository.save(TenSignal.builder()
                .displayName("Sync User")
                .email("sync@example.com")
                .user(user)
                .publicSlug("sync-user-slug")
                .ownerTokenHash(tokenHashingService.hashToken(rawToken))
                .ownerTokenExpiresAt(clock.instant().plus(Duration.ofHours(24)))
                .preferredLocale("tr")
                .build());

        UpdateLocaleRequest req = new UpdateLocaleRequest();
        req.setLocale("en");

        mockMvc.perform(put("/api/v1/tensignal/owner/locale")
                        .header("X-Owner-Token", rawToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferredLocale").value("en"));

        TenSignal updated = tenSignalRepository.findById(tenSignal.getId()).orElseThrow();
        assertThat(updated.getPreferredLocale()).isEqualTo("en");

        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.getPreferredLocale()).isEqualTo("en");
    }

    @Test
    @DisplayName("12.F: PUT /api/v1/tensignal/owner/locale rejects invalid locales and unauthorized tokens")
    void updateOwnerLocaleValidation() throws Exception {
        String rawToken = "valid-token-for-val";
        User user = userRepository.save(User.builder().email("val@example.com").build());
        tenSignalRepository.save(TenSignal.builder()
                .displayName("Val User")
                .email("val@example.com")
                .user(user)
                .publicSlug("val-slug")
                .ownerTokenHash(tokenHashingService.hashToken(rawToken))
                .ownerTokenExpiresAt(clock.instant().plus(Duration.ofHours(24)))
                .build());

        // 1. Invalid locale value (e.g. "de") -> 400 Bad Request
        UpdateLocaleRequest invalidReq = new UpdateLocaleRequest();
        invalidReq.setLocale("de");
        mockMvc.perform(put("/api/v1/tensignal/owner/locale")
                        .header("X-Owner-Token", rawToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest());

        // 2. Unauthorized without token -> 401
        UpdateLocaleRequest validReq = new UpdateLocaleRequest();
        validReq.setLocale("en");
        mockMvc.perform(put("/api/v1/tensignal/owner/locale")
                        .header("X-Owner-Token", "invalid-token-xyz")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("12.E: Outbox snapshots account preferredLocale across all notification types")
    void outboxSnapshotsAccountPreferredLocale() throws Exception {
        String email = "notify-en@example.com";
        User user = userRepository.save(User.builder().email(email).preferredLocale("en").build());
        tenSignalRepository.save(TenSignal.builder()
                .displayName("Notify En")
                .email(email)
                .user(user)
                .publicSlug("notify-slug")
                .ownerTokenHash(tokenHashingService.hashToken("notify-token"))
                .ownerTokenExpiresAt(clock.instant().plus(Duration.ofHours(24)))
                .preferredLocale("en")
                .build());

        Map<String, Object> vars = Map.of(
                "ownerName", "Alex",
                "respondentName", "Jordan",
                "dashboardUrl", "https://tensignal.app/#/dashboard"
        );

        notificationService.enqueue(
                NotificationType.NEW_EVALUATION,
                email,
                user.getId(),
                "en",
                vars,
                "test-idem-key-1",
                clock.instant(),
                null
        );

        List<EmailOutboxEntity> mails = outboxRepository.findAll();
        assertThat(mails).hasSize(1);
        EmailOutboxEntity outbox = mails.get(0);
        assertThat(outbox.getLocale()).isEqualTo("en");

        Map<String, Object> payload = objectMapper.readValue(outbox.getPayloadJson(), new TypeReference<Map<String, Object>>() {});
        RenderedEmailContent rendered = templateService.render(NotificationType.valueOf(outbox.getNotificationType()), outbox.getLocale(), payload);
        assertThat(rendered.getSubject()).containsIgnoringCase("new evaluations received");
        assertThat(rendered.getHtmlBody()).contains("evaluations have been submitted");
    }

    @Test
    @DisplayName("12.E: All NotificationType values render valid subject and body for both 'tr' and 'en'")
    void allNotificationTypesRenderInBothLocales() {
        Map<String, Object> vars = new HashMap<>();
        vars.put("ownerName", "Alex");
        vars.put("respondentName", "Jordan");
        vars.put("code", "123456");
        vars.put("dashboardUrl", "https://tensignal.app/#/dashboard");
        vars.put("unlockUrl", "https://tensignal.app/#/dashboard");
        vars.put("shareUrl", "https://tensignal.app/#/quiz");
        vars.put("amount", "$19.00");
        vars.put("receiptUrl", "https://tensignal.app/#/billing");
        vars.put("currentCapacity", "8");
        vars.put("maxCapacity", "10");
        vars.put("hoursLeft", "24");
        vars.put("date", "2026-10-12");
        vars.put("securityUrl", "https://tensignal.app/#/settings?tab=security");

        for (NotificationType type : NotificationType.values()) {
            for (String locale : List.of("tr", "en")) {
                RenderedEmailContent rendered = templateService.render(type, locale, vars);
                assertThat(rendered).as("NotificationType %s in %s", type, locale).isNotNull();
                assertThat(rendered.getSubject()).as("Subject for %s in %s", type, locale).isNotBlank();
                assertThat(rendered.getHtmlBody()).as("HTML body for %s in %s", type, locale).isNotBlank();
                assertThat(rendered.getTextBody()).as("Text body for %s in %s", type, locale).isNotBlank();
                assertThat(rendered.getHtmlBody()).contains("<html lang=\"" + locale + "\"");
            }
        }
    }
}
