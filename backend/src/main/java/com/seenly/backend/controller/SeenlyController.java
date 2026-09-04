package com.seenly.backend.controller;

import com.seenly.backend.dto.*;
import com.seenly.backend.service.AuthService;
import com.seenly.backend.service.FriendResponseService;
import com.seenly.backend.service.SeenlyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/seenly")
@RequiredArgsConstructor
public class SeenlyController {

    private final SeenlyService seenlyService;
    private final AuthService authService;
    private final FriendResponseService friendResponseService;

    /**
     * POST /api/v1/seenly/create
     * Creates a new Seenly profile with owner's self answers.
     */
    @PostMapping("/create")
    public ResponseEntity<CreateSeenlyResponse> createSeenly(@Valid @RequestBody CreateSeenlyRequest request) {
        return ResponseEntity.ok(seenlyService.createSeenly(request));
    }

    /**
     * POST /api/v1/seenly/auth/send-code
     * Sends an OTP code to the user's email.
     */
    @PostMapping("/auth/send-code")
    public ResponseEntity<Map<String, String>> sendVerificationCode(
            @Valid @RequestBody EmailAuthRequest request,
            @RequestParam(required = false, defaultValue = "false") boolean isLogin) {
        return ResponseEntity.ok(authService.sendVerificationCode(request.getEmail(), isLogin));
    }

    /**
     * POST /api/v1/seenly/auth/verify-code
     * Verifies the OTP code for the user's email.
     */
    @PostMapping("/auth/verify-code")
    public ResponseEntity<Map<String, String>> verifyCode(@Valid @RequestBody EmailAuthRequest request) {
        return ResponseEntity.ok(authService.verifyCode(request.getEmail(), request.getCode()));
    }

    /**
     * POST /api/v1/seenly/auth/login-email
     * Logins user and issues a fresh ownerToken.
     */
    @PostMapping("/auth/login-email")
    public ResponseEntity<Map<String, String>> loginWithEmail(@Valid @RequestBody EmailAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithEmail(request.getEmail(), request.getCode()));
    }

    /**
     * GET /api/v1/seenly/owner/{ownerToken}
     * Returns owner dashboard snapshot with dynamic privacy masking.
     */
    @GetMapping("/owner/{ownerToken}")
    public ResponseEntity<ResultSnapshotDto> getOwnerDashboard(@PathVariable String ownerToken) {
        return ResponseEntity.ok(seenlyService.getOwnerDashboard(ownerToken));
    }

    /**
     * PUT /api/v1/seenly/owner/display-name
     * Updates the owner's display name with a 14-day cooldown rule.
     */
    @PutMapping("/owner/display-name")
    public ResponseEntity<ResultSnapshotDto> updateDisplayName(
            @RequestHeader("X-Owner-Token") String ownerToken,
            @Valid @RequestBody UpdateDisplayNameRequest request) {
        return ResponseEntity.ok(seenlyService.updateDisplayName(ownerToken, request.getDisplayName()));
    }

    /**
     * PUT /api/v1/seenly/owner/email
     * Updates the owner's email address.
     */
    @PutMapping("/owner/email")
    public ResponseEntity<ResultSnapshotDto> updateEmail(
            @RequestHeader("X-Owner-Token") String ownerToken,
            @Valid @RequestBody UpdateEmailRequest request) {
        return ResponseEntity.ok(seenlyService.updateEmail(ownerToken, request.getEmail()));
    }

    /**
     * PUT /api/v1/seenly/owner/avatar
     * Updates the owner's chosen avatar.
     */
    @PutMapping("/owner/avatar")
    public ResponseEntity<ResultSnapshotDto> updateAvatar(
            @RequestHeader("X-Owner-Token") String ownerToken,
            @Valid @RequestBody UpdateAvatarRequest request) {
        return ResponseEntity.ok(seenlyService.updateAvatar(ownerToken, request.getAvatar()));
    }

    /**
     * GET /api/v1/seenly/public/{publicSlug}
     * Returns public dashboard snapshot with zero-leak privacy masking.
     */
    @GetMapping("/public/{publicSlug}")
    public ResponseEntity<ResultSnapshotDto> getPublicDashboard(@PathVariable String publicSlug) {
        return ResponseEntity.ok(seenlyService.getPublicDashboard(publicSlug));
    }

    /**
     * POST /api/v1/seenly/friend/{publicSlug}/check-eligibility
     * Checks if the user is eligible to take the quiz (not owner, not duplicate).
     */
    @PostMapping("/friend/{publicSlug}/check-eligibility")
    public ResponseEntity<Map<String, Object>> checkEligibility(
            @PathVariable String publicSlug,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest httpRequest,
            @RequestBody(required = false) EligibilityCheckRequest request) {
        String fingerprint = request != null ? request.getFingerprintHash() : null;
        return ResponseEntity.ok(seenlyService.checkEligibility(publicSlug, ownerToken, httpRequest.getRemoteAddr(), fingerprint));
    }

    /**
     * POST /api/v1/seenly/friend/{publicSlug}/respond
     * Submits a friend's evaluation and returns updated progression metrics.
     */
    @PostMapping("/friend/{publicSlug}/respond")
    public ResponseEntity<SubmitResponseResult> submitFriendResponse(
            @PathVariable String publicSlug,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest httpRequest,
            @Valid @RequestBody FriendResponseInput request) {
        return ResponseEntity.ok(friendResponseService.processFriendSubmission(
            publicSlug, ownerToken, httpRequest.getRemoteAddr(), request
        ));
    }

    /**
     * POST /api/v1/seenly/profile/{publicSlug}/increment-click
     * Increments the profile click/visit count on public link load.
     */
    @PostMapping("/profile/{publicSlug}/increment-click")
    public ResponseEntity<Map<String, Object>> incrementClick(@PathVariable String publicSlug) {
        int count = seenlyService.incrementProfileClick(publicSlug);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "totalProfileClicks", count
        ));
    }
}
