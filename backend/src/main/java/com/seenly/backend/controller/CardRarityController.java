package com.seenly.backend.controller;

import com.seenly.backend.dto.CardRarityDto;
import com.seenly.backend.service.CardRarityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/rarity")
@CrossOrigin(origins = "*")
public class CardRarityController {

    private final CardRarityService rarityService;

    public CardRarityController(CardRarityService rarityService) {
        this.rarityService = rarityService;
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, CardRarityDto>> getAllCardRarities(
            @RequestParam(defaultValue = "tr") String lang
    ) {
        return ResponseEntity.ok(rarityService.getAllCardRarities(lang));
    }

    @GetMapping("/card/{cardId}")
    public ResponseEntity<CardRarityDto> getCardRarity(
            @PathVariable String cardId,
            @RequestParam(defaultValue = "tr") String lang
    ) {
        CardRarityDto dto = rarityService.getCardRarity(cardId, lang);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/event/generated")
    public ResponseEntity<Map<String, Object>> recordGeneration(
            @RequestBody Map<String, String> payload
    ) {
        String cardId = payload.get("cardId");
        if (cardId != null && !cardId.isBlank()) {
            rarityService.recordCardGeneration(cardId);
            return ResponseEntity.ok(Map.of("status", "recorded", "cardId", cardId));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "cardId is required"));
    }
}
