package com.tensignal.backend.service;

import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class TokenHashingService {

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder().withoutPadding();

    /**
     * Hashes raw ownerToken string using SHA-256 for secure DB matching.
     */
    public String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Token cannot be null or empty");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error initializing SHA-256 hashing algorithm", e);
        }
    }

    /**
     * Generates a raw cryptographically secure token to send once to the client.
     * Uses a SecureRandom generator to output a high-entropy URL-safe Base64 string directly.
     */
    public String generateRawToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

    /**
     * Generates a unique, short, URL-safe random string for public friend response links.
     * Uses a SecureRandom generator to output an 8-character Base64 string.
     */
    public String generatePublicSlug() {
        byte[] randomBytes = new byte[6]; // 6 bytes generates exactly an 8-character Base64 string
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }
}
