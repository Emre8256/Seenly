package com.seenly.backend.controller;

import com.seenly.backend.dto.ResultSnapshotDto;
import com.seenly.backend.service.BillingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/subscribe-plus")
    public ResponseEntity<ResultSnapshotDto> subscribePlus(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerTokenHeader,
            @RequestParam(value = "ownerToken", required = false) String ownerTokenParam) {
        String ownerToken = resolveOwnerToken(ownerTokenHeader, ownerTokenParam);
        return ResponseEntity.ok(billingService.subscribePlus(ownerToken));
    }

    @PostMapping("/buy-pack")
    public ResponseEntity<ResultSnapshotDto> buyPack(
            @RequestParam int amount,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerTokenHeader,
            @RequestParam(value = "ownerToken", required = false) String ownerTokenParam) {
        String ownerToken = resolveOwnerToken(ownerTokenHeader, ownerTokenParam);
        return ResponseEntity.ok(billingService.buyPack(ownerToken, amount));
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<Void> deleteAccount(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerTokenHeader,
            @RequestParam(value = "ownerToken", required = false) String ownerTokenParam) {
        String ownerToken = resolveOwnerToken(ownerTokenHeader, ownerTokenParam);
        billingService.deleteAccount(ownerToken);
        return ResponseEntity.ok().build();
    }

    private String resolveOwnerToken(String header, String param) {
        return header != null && !header.isBlank() ? header : param;
    }
}
