package com.tensignal.backend.controller;

import com.tensignal.backend.dto.CardRarityDto;
import com.tensignal.backend.service.CardRarityService;
import com.tensignal.backend.service.RateLimitService;
import com.tensignal.backend.service.AbuseSignalService;
import com.tensignal.backend.service.ClientIpResolver;
import com.tensignal.backend.config.RateLimitPolicy;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/rarity")
@RequiredArgsConstructor
@Validated
public class CardRarityController {

    private final CardRarityService rarityService;
    private final RateLimitService rateLimitService;
    private final AbuseSignalService abuseSignalService;
    private final ClientIpResolver clientIpResolver;
    private final RateLimitPolicy ratePolicy;

    @GetMapping("/all")
    public ResponseEntity<Map<String, CardRarityDto>> getAllCardRarities(
            @RequestParam(defaultValue = "tr") @Pattern(regexp = "tr|en") String lang,
            HttpServletRequest request
    ) {
        limit(request, "RARITY_ALL");
        return ResponseEntity.ok(rarityService.getAllCardRarities(lang));
    }

    @GetMapping("/card/{cardId}")
    public ResponseEntity<CardRarityDto> getCardRarity(
            @PathVariable @Pattern(regexp = "[a-z0-9_]{1,64}") String cardId,
            @RequestParam(defaultValue = "tr") @Pattern(regexp = "tr|en") String lang,
            HttpServletRequest request
    ) {
        limit(request, "RARITY_CARD");
        CardRarityDto dto = rarityService.getCardRarity(cardId, lang);
        return ResponseEntity.ok(dto);
    }

    private void limit(HttpServletRequest request, String action) {
        rateLimitService.check(action, abuseSignalService.networkHash(clientIpResolver.resolve(request)),
            ratePolicy.publicReads, Duration.ofMinutes(1));
    }
}
