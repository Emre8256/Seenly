package com.seenly.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AbuseSignalService {
    private final TokenHashingService hashingService;

    public String fingerprintHash(String clientSignal) {
        if (clientSignal == null || clientSignal.isBlank()) {
            throw new IllegalArgumentException("Fingerprint signal is required.");
        }
        return hashingService.hashToken("fingerprint:v1:" + clientSignal.trim().toLowerCase(Locale.ROOT));
    }

    public String networkHash(String remoteAddress) {
        String normalized = remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress.trim();
        return hashingService.hashToken("network:v1:" + normalized);
    }
}
