package com.seenly.backend.controller;

import com.seenly.backend.dto.*;
import com.seenly.backend.service.AuthService;
import com.seenly.backend.service.FriendResponseService;
import com.seenly.backend.service.SeenlyService;
import com.seenly.backend.service.OwnerSessionService;
import com.seenly.backend.service.RateLimitService;
import com.seenly.backend.service.AbuseSignalService;
import com.seenly.backend.service.ClientIpResolver;
import com.seenly.backend.config.RateLimitPolicy;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Pattern;

import java.time.Duration;
import java.util.Map;
import java.util.Locale;

@Slf4j
@RestController
@RequestMapping("/api/v1/seenly")
@RequiredArgsConstructor
@Validated
public class SeenlyController {

    private final SeenlyService seenlyService;
    private final AuthService authService;
    private final FriendResponseService friendResponseService;
    private final OwnerSessionService ownerSessionService;
    private final RateLimitService rateLimitService;
    private final AbuseSignalService abuseSignalService;
    private final ClientIpResolver clientIpResolver;
    private final RateLimitPolicy ratePolicy;

    /**
     * POST /api/v1/seenly/create
     * Creates a new Seenly profile with owner's self answers.
     */
    @PostMapping("/create")
    public ResponseEntity<CreateSeenlyResponse> createSeenly(
            @Valid @RequestBody CreateSeenlyRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("REGISTER", network(httpRequest) + "|" + normalize(request.getEmail()),
            ratePolicy.registration, Duration.ofHours(1));
        return ResponseEntity.ok(seenlyService.createSeenly(request));
    }

    /**
     * POST /api/v1/seenly/auth/send-code
     * Sends an OTP code to the user's email.
     */
    @PostMapping("/auth/send-code")
    public ResponseEntity<Map<String, String>> sendVerificationCode(
            @Valid @RequestBody SendOtpRequest request,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest httpRequest) {
        String network = network(httpRequest);
        rateLimitService.check("OTP_SEND_NETWORK", network, ratePolicy.otpSendPerNetwork, Duration.ofMinutes(10));
        rateLimitService.check("OTP_SEND_EMAIL", network + "|" + normalize(request.getEmail()),
            ratePolicy.otpSendPerEmail, Duration.ofMinutes(10));
        return ResponseEntity.ok(authService.sendVerificationCode(request.getEmail(), request.getPurpose(), ownerToken));
    }

    /**
     * POST /api/v1/seenly/auth/verify-code
     * Verifies the OTP code for the user's email.
     */
    @PostMapping("/auth/verify-code")
    public ResponseEntity<OtpVerificationResponse> verifyCode(
            @Valid @RequestBody VerifyOtpRequest request,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest httpRequest) {
        rateLimitService.check("OTP_VERIFY", network(httpRequest) + "|" + normalize(request.getEmail()),
            ratePolicy.otpAttempts, Duration.ofMinutes(10));
        return ResponseEntity.ok(authService.verifyCode(
            request.getEmail(), request.getCode(), request.getPurpose(), ownerToken));
    }

    /**
     * POST /api/v1/seenly/auth/login-email
     * Logins user and issues a fresh ownerToken.
     */
    @PostMapping("/auth/login-email")
    public ResponseEntity<LoginResponse> loginWithEmail(
            @Valid @RequestBody EmailAuthRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("OTP_LOGIN", network(httpRequest) + "|" + normalize(request.getEmail()),
            ratePolicy.otpAttempts, Duration.ofMinutes(10));
        return ResponseEntity.ok(authService.loginWithEmail(request.getEmail(), request.getCode()));
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken) {
        rateLimitService.check("LOGOUT", ownerToken == null ? "missing" : ownerToken,
            ratePolicy.ownerMutations, Duration.ofMinutes(1));
        ownerSessionService.revoke(ownerToken);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/seenly/owner
     * Returns owner dashboard snapshot with dynamic privacy masking.
     */
    @GetMapping("/owner")
    public ResponseEntity<OwnerDashboardDto> getOwnerDashboard(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken) {
        return ResponseEntity.ok(seenlyService.getOwnerDashboard(ownerToken));
    }

    @GetMapping("/owner/responses")
    public ResponseEntity<OwnerResponseHistoryPageDto> getOwnerResponseHistory(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        return ResponseEntity.ok(seenlyService.getOwnerResponseHistory(ownerToken, cursor, limit));
    }

    /**
     * PUT /api/v1/seenly/owner/display-name
     * Updates the owner's display name with a 14-day cooldown rule.
     */
    @PutMapping("/owner/display-name")
    public ResponseEntity<OwnerDashboardDto> updateDisplayName(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @Valid @RequestBody UpdateDisplayNameRequest request,
            HttpServletRequest httpRequest) {
        ownerMutationLimit("OWNER_NAME", ownerToken, httpRequest);
        return ResponseEntity.ok(seenlyService.updateDisplayName(ownerToken, request.getDisplayName()));
    }

    /**
     * PUT /api/v1/seenly/owner/email
     * Updates the owner's email address.
     */
    @PutMapping("/owner/email")
    public ResponseEntity<OwnerDashboardDto> updateEmail(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @Valid @RequestBody UpdateEmailRequest request,
            HttpServletRequest httpRequest) {
        ownerMutationLimit("OWNER_EMAIL", ownerToken, httpRequest);
        return ResponseEntity.ok(seenlyService.updateEmail(
            ownerToken, request.getEmail(), request.getVerificationGrant()));
    }

    /**
     * PUT /api/v1/seenly/owner/avatar
     * Updates the owner's chosen avatar.
     */
    @PutMapping("/owner/avatar")
    public ResponseEntity<OwnerDashboardDto> updateAvatar(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @Valid @RequestBody UpdateAvatarRequest request,
            HttpServletRequest httpRequest) {
        ownerMutationLimit("OWNER_AVATAR", ownerToken, httpRequest);
        return ResponseEntity.ok(seenlyService.updateAvatar(ownerToken, request.getAvatar()));
    }

    /**
     * GET /api/v1/seenly/public/{publicSlug}
     * Returns public dashboard snapshot with zero-leak privacy masking.
     */
    @GetMapping("/public/{publicSlug}")
    public ResponseEntity<PublicProfileDto> getPublicDashboard(
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{8}") String publicSlug,
            HttpServletRequest httpRequest) {
        rateLimitService.check("PUBLIC_PROFILE", network(httpRequest) + "|" + publicSlug,
            ratePolicy.publicReads, Duration.ofMinutes(1));
        return ResponseEntity.ok(seenlyService.getPublicDashboard(publicSlug));
    }

    /**
     * POST /api/v1/seenly/friend/{publicSlug}/check-eligibility
     * Checks if the user is eligible to take the quiz (not owner, not duplicate).
     */
    @PostMapping("/friend/{publicSlug}/check-eligibility")
    public ResponseEntity<EligibilityResponseDto> checkEligibility(
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{8}") String publicSlug,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest httpRequest,
            @Valid @RequestBody EligibilityCheckRequest request) {
        rateLimitService.check("ELIGIBILITY", network(httpRequest) + "|" + publicSlug,
            ratePolicy.eligibility, Duration.ofMinutes(1));
        return ResponseEntity.ok(seenlyService.checkEligibility(publicSlug, ownerToken, request.getFingerprintHash()));
    }

    /**
     * POST /api/v1/seenly/friend/{publicSlug}/respond
     * Submits a friend's evaluation and returns updated progression metrics.
     */
    @PostMapping("/friend/{publicSlug}/respond")
    public ResponseEntity<ParticipantSubmissionResultDto> submitFriendResponse(
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{8}") String publicSlug,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest httpRequest,
            @Valid @RequestBody FriendResponseInput request) {
        String network = network(httpRequest);
        rateLimitService.check("SUBMIT_NETWORK", network, ratePolicy.submissionPerNetwork, Duration.ofHours(1));
        rateLimitService.check("SUBMIT_TARGET_NETWORK", network + "|" + publicSlug,
            ratePolicy.submissionPerTargetNetwork, Duration.ofHours(1));
        return ResponseEntity.ok(friendResponseService.processFriendSubmission(
            publicSlug, ownerToken, clientIpResolver.resolve(httpRequest), request
        ));
    }

    /**
     * POST /api/v1/seenly/profile/{publicSlug}/increment-click
     * Increments the profile click/visit count on public link load.
     */
    @PostMapping("/profile/{publicSlug}/increment-click")
    public ResponseEntity<Map<String, Object>> incrementClick(
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{8}") String publicSlug,
            HttpServletRequest httpRequest) {
        rateLimitService.check("PROFILE_CLICK", network(httpRequest) + "|" + publicSlug,
            ratePolicy.clicks, Duration.ofMinutes(1));
        int count = seenlyService.incrementProfileClick(publicSlug);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "totalProfileClicks", count
        ));
    }

    private String network(HttpServletRequest request) {
        return abuseSignalService.networkHash(clientIpResolver.resolve(request));
    }

    private String normalize(String value) {
        return value == null ? "missing" : value.trim().toLowerCase(Locale.ROOT);
    }

    private void ownerMutationLimit(String action, String ownerToken, HttpServletRequest request) {
        rateLimitService.check(action, network(request) + "|" + (ownerToken == null ? "missing" : ownerToken),
            ratePolicy.ownerMutations, Duration.ofMinutes(1));
    }
}
