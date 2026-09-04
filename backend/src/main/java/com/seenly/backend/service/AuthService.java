package com.seenly.backend.service;

import com.seenly.backend.entity.Seenly;
import com.seenly.backend.exception.EmailAlreadyExistsException;
import com.seenly.backend.exception.EmailNotFoundException;
import com.seenly.backend.exception.VerificationException;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SeenlyRepository seenlyRepository;
    private final UserRepository userRepository;
    private final TokenHashingService tokenHashingService;

    @Value("${spring.profiles.active:dev}")
    private String activeProfile = "dev";

    // Concurrent in-memory OTP cache (lowerCase email -> 4-digit code)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Sends an OTP verification code to the given email address.
     * Enforces strict separation between Login and Registration/Claim flows.
     */
    public Map<String, String> sendVerificationCode(String email, boolean isLogin) {
        String normalizedEmail = normalizeEmail(email);

        boolean profileExists = seenlyRepository.existsByEmail(normalizedEmail) || userRepository.existsByEmail(normalizedEmail);

        if (isLogin) {
            if (!profileExists) {
                throw new EmailNotFoundException("Bu e-posta adresine ait bir hesap bulunamadı. Lütfen önce profilinizi oluşturun.");
            }
        } else {
            if (profileExists) {
                throw new EmailAlreadyExistsException("Bu e-posta adresiyle kayıtlı bir hesap zaten mevcut. Lütfen giriş yapın.");
            }
        }

        String code = "dev".equalsIgnoreCase(activeProfile) ? "1234" : generateAlphanumericCode();
        otpStorage.put(normalizedEmail, code);

        log.info("[MAIL MOCK] Verification request received for email: {} (isLogin: {}) | Code: {}", normalizedEmail, isLogin, code);

        return Map.of(
            "status", "success",
            "message", "Verification code sent successfully."
        );
    }

    /**
     * Verifies the submitted OTP code.
     */
    public Map<String, String> verifyCode(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        String storedCode = otpStorage.get(normalizedEmail);

        if (storedCode != null && storedCode.equalsIgnoreCase(code.trim())) {
            otpStorage.remove(normalizedEmail);
            return Map.of(
                "status", "success",
                "message", "Verification successful."
            );
        } else {
            throw new VerificationException("Geçersiz doğrulama kodu. Lütfen tekrar deneyin.");
        }
    }

    /**
     * Logins the user by validating OTP and issuing a new owner token.
     */
    public Map<String, String> loginWithEmail(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        String storedCode = otpStorage.get(normalizedEmail);

        if (storedCode == null || !storedCode.equalsIgnoreCase(code.trim())) {
            throw new VerificationException("Geçersiz doğrulama kodu. Lütfen tekrar deneyin.");
        }

        otpStorage.remove(normalizedEmail);

        Seenly seenly = seenlyRepository.findFirstByEmailOrderByCreatedAtDesc(normalizedEmail)
            .orElseThrow(() -> new EmailNotFoundException("Bu e-posta adresine ait bir hesap bulunamadı. Lütfen önce profilinizi oluşturun."));

        String rawToken = tokenHashingService.generateRawToken();
        String tokenHash = tokenHashingService.hashToken(rawToken);

        seenly.setOwnerTokenHash(tokenHash);
        seenlyRepository.save(seenly);

        return Map.of(
            "ownerToken", rawToken,
            "publicSlug", seenly.getPublicSlug()
        );
    }

    private String normalizeEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("E-posta adresi boş bırakılamaz.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateAlphanumericCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
