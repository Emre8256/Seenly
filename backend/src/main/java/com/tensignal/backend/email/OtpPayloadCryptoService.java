package com.tensignal.backend.email;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class OtpPayloadCryptoService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKey secretKey;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpPayloadCryptoService(
            @Value("${app.email.outbox.otp-payload-secret:seenly-default-secure-otp-payload-key-256bit}") String rawKey,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.secretKey = deriveKey(rawKey);
    }

    private SecretKey deriveKey(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, "AES");
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to initialize AES key for OTP payload encryption", ex);
        }
    }

    public String encryptPayload(Map<String, Object> payload) {
        try {
            byte[] plaintext = objectMapper.writeValueAsBytes(payload);
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);
            byte[] ciphertext = cipher.doFinal(plaintext);

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);

            String encoded = Base64.getEncoder().encodeToString(buffer.array());
            return objectMapper.writeValueAsString(Map.of("encrypted", encoded));
        } catch (Exception ex) {
            log.error("Failed to encrypt outbox OTP payload");
            throw new IllegalStateException("Could not encrypt OTP payload", ex);
        }
    }

    public Map<String, Object> decryptPayload(String payloadJson) {
        try {
            Map<String, Object> wrapper = objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
            if (!wrapper.containsKey("encrypted")) {
                // If it's not encrypted wrapper, return as is (for backwards/generic payload)
                return wrapper;
            }
            String encoded = (String) wrapper.get("encrypted");
            byte[] combined = Base64.getDecoder().decode(encoded);

            ByteBuffer buffer = ByteBuffer.wrap(combined);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);
            byte[] decrypted = cipher.doFinal(ciphertext);

            return objectMapper.readValue(decrypted, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            log.error("Failed to decrypt outbox OTP payload");
            throw new IllegalStateException("Could not decrypt OTP payload", ex);
        }
    }
}
