package com.tensignal.backend.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class RegionResolutionService {

    public static final String CURRENCY_USD = "USD";

    /**
     * Resolves currency: always returns canonical "USD" for all requests worldwide.
     */
    public String resolveCurrency(HttpServletRequest request) {
        return CURRENCY_USD;
    }

    /**
     * Resolves two-letter ISO country code.
     */
    public String resolveCountry(HttpServletRequest request) {
        if (request == null) {
            return "US";
        }

        String cfCountry = request.getHeader("CF-IPCountry");
        if (cfCountry != null && !cfCountry.isBlank() && !"XX".equalsIgnoreCase(cfCountry)) {
            return cfCountry.trim().toUpperCase(Locale.ROOT);
        }

        String countryCode = request.getHeader("X-Country-Code");
        if (countryCode != null && !countryCode.isBlank()) {
            return countryCode.trim().toUpperCase(Locale.ROOT);
        }

        String geoCountry = request.getHeader("X-Geo-Country");
        if (geoCountry != null && !geoCountry.isBlank()) {
            return geoCountry.trim().toUpperCase(Locale.ROOT);
        }

        String clientCountry = request.getHeader("X-Client-Country");
        if (clientCountry != null && !clientCountry.isBlank()) {
            return clientCountry.trim().toUpperCase(Locale.ROOT);
        }

        return "US";
    }
}

