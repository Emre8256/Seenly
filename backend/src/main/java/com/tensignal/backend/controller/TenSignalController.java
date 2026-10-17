package com.tensignal.backend.controller;

import com.tensignal.backend.constant.OtpPurpose;
import com.tensignal.backend.dto.*;
import com.tensignal.backend.service.AuthService;
import com.tensignal.backend.service.FriendResponseService;
import com.tensignal.backend.service.TenSignalService;
import com.tensignal.backend.service.OwnerSessionService;
import com.tensignal.backend.service.RateLimitService;
import com.tensignal.backend.service.AbuseSignalService;
import com.tensignal.backend.service.ClientIpResolver;
import com.tensignal.backend.config.RateLimitPolicy;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Pattern;

import java.time.Duration;
import java.util.Map;
import java.util.Locale;

@Slf4j
@RestController
@RequestMapping("/api/v1/tensignal")
@RequiredArgsConstructor
@Validated
public class TenSignalController {

    private final TenSignalService tenSignalService;
    private final AuthService authService;
    private final FriendResponseService friendResponseService;
    private final OwnerSessionService ownerSessionService;
    private final RateLimitService rateLimitService;
    private final AbuseSignalService abuseSignalService;
    private final ClientIpResolver clientIpResolver;
    private final RateLimitPolicy ratePolicy;

    /**
     * POST /api/v1/tensignal/create
     * Creates a new TenSignal profile with owner's self answers.
     */
    @PostMapping("/create")
    public ResponseEntity<CreateTenSignalResponse> createTenSignal(
            @Valid @RequestBody CreateTenSignalRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("REGISTER", network(httpRequest) + "|" + normalize(request.getEmail()),
            ratePolicy.registration, Duration.ofHours(1));
        return ResponseEntity.ok(tenSignalService.createTenSignal(request));
    }

    /**
     * POST /api/v1/tensignal/auth/send-code
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
        return ResponseEntity.ok(authService.sendVerificationCode(request.getEmail(), request.getPurpose(), ownerToken, request.getLocale()));
    }

    /**
     * GET /api/v1/tensignal/auth/otp-delivery-status
     * Returns the delivery status of the verification email (PENDING, DELIVERED, FAILED).
     */
    @GetMapping("/auth/otp-delivery-status")
    public ResponseEntity<Map<String, Object>> getOtpDeliveryStatus(
            @RequestParam("email") String email,
            @RequestParam("purpose") OtpPurpose purpose,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest httpRequest) {
        rateLimitService.check("OTP_STATUS", network(httpRequest) + "|" + normalize(email),
            ratePolicy.publicReads, Duration.ofMinutes(1));
        return ResponseEntity.ok(authService.getOtpDeliveryStatus(email, purpose, ownerToken));
    }

    /**
     * POST /api/v1/tensignal/auth/verify-code
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
     * POST /api/v1/tensignal/auth/login-email
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
     * GET /api/v1/tensignal/owner
     * Returns owner dashboard snapshot with dynamic privacy masking.
     */
    @GetMapping("/owner")
    public ResponseEntity<OwnerDashboardDto> getOwnerDashboard(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken) {
        return ResponseEntity.ok(tenSignalService.getOwnerDashboard(ownerToken));
    }

    @GetMapping("/owner/responses")
    public ResponseEntity<OwnerResponseHistoryPageDto> getOwnerResponseHistory(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        return ResponseEntity.ok(tenSignalService.getOwnerResponseHistory(ownerToken, cursor, limit));
    }

    /**
     * PUT /api/v1/tensignal/owner/display-name
     * Updates the owner's display name with a 14-day cooldown rule.
     */
    @PutMapping("/owner/display-name")
    public ResponseEntity<OwnerDashboardDto> updateDisplayName(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @Valid @RequestBody UpdateDisplayNameRequest request,
            HttpServletRequest httpRequest) {
        ownerMutationLimit("OWNER_NAME", ownerToken, httpRequest);
        return ResponseEntity.ok(tenSignalService.updateDisplayName(ownerToken, request.getDisplayName()));
    }

    /**
     * PUT /api/v1/tensignal/owner/email
     * Updates the owner's email address.
     */
    @PutMapping("/owner/email")
    public ResponseEntity<OwnerDashboardDto> updateEmail(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @Valid @RequestBody UpdateEmailRequest request,
            HttpServletRequest httpRequest) {
        ownerMutationLimit("OWNER_EMAIL", ownerToken, httpRequest);
        return ResponseEntity.ok(tenSignalService.updateEmail(
            ownerToken, request.getEmail(), request.getVerificationGrant()));
    }

    /**
     * PUT /api/v1/tensignal/owner/avatar
     * Updates the owner's chosen avatar.
     */
    @PutMapping("/owner/avatar")
    public ResponseEntity<OwnerDashboardDto> updateAvatar(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @Valid @RequestBody UpdateAvatarRequest request,
            HttpServletRequest httpRequest) {
        ownerMutationLimit("OWNER_AVATAR", ownerToken, httpRequest);
        return ResponseEntity.ok(tenSignalService.updateAvatar(ownerToken, request.getAvatar()));
    }

    /**
     * PUT /api/v1/tensignal/owner/locale
     * Updates the owner's preferred locale.
     */
    @PutMapping("/owner/locale")
    public ResponseEntity<OwnerDashboardDto> updateLocale(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @Valid @RequestBody UpdateLocaleRequest request,
            HttpServletRequest httpRequest) {
        ownerMutationLimit("OWNER_LOCALE", ownerToken, httpRequest);
        return ResponseEntity.ok(tenSignalService.updateLocale(ownerToken, request.getLocale()));
    }

    @GetMapping("/owner/notification-preferences")
    public ResponseEntity<NotificationPreferencesDto> getNotificationPreferences(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken) {
        return ResponseEntity.ok(tenSignalService.getNotificationPreferences(ownerToken));
    }

    @PutMapping("/owner/notification-preferences")
    public ResponseEntity<NotificationPreferencesDto> updateNotificationPreferences(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            @RequestBody NotificationPreferencesDto request,
            HttpServletRequest httpRequest) {
        rateLimitService.check("OWNER_PREFS", network(httpRequest) + "|" + (ownerToken == null ? "missing" : ownerToken),
            ratePolicy.ownerPreferences, Duration.ofMinutes(1));
        return ResponseEntity.ok(tenSignalService.updateNotificationPreferences(ownerToken, request));
    }

    /**
     * GET /api/v1/tensignal/public/{publicSlug}
     * Returns public dashboard snapshot with server-side access control for outside perception.
     * Response is private/no-store to prevent CDN/browser cache leakage across viewers.
     */
    @GetMapping("/public/{publicSlug}")
    public ResponseEntity<PublicProfileDto> getPublicDashboard(
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{8}") String publicSlug,
            @RequestHeader(value = "X-Participant-Signal", required = false) String participantSignal,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            HttpServletRequest httpRequest) {
        rateLimitService.check("PUBLIC_PROFILE", network(httpRequest) + "|" + publicSlug,
            ratePolicy.publicReads, Duration.ofMinutes(1));
        PublicProfileDto profile = tenSignalService.getPublicDashboard(publicSlug, participantSignal, ownerToken);
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store, max-age=0")
            .body(profile);
    }

    /**
     * POST /api/v1/tensignal/friend/{publicSlug}/check-eligibility
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
        return ResponseEntity.ok(tenSignalService.checkEligibility(publicSlug, ownerToken, request.getFingerprintHash()));
    }

    /**
     * POST /api/v1/tensignal/friend/{publicSlug}/respond
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
     * POST /api/v1/tensignal/profile/{publicSlug}/increment-click
     * Increments the profile click/visit count on public link load.
     */
    @PostMapping("/profile/{publicSlug}/increment-click")
    public ResponseEntity<Map<String, Object>> incrementClick(
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{8}") String publicSlug,
            HttpServletRequest httpRequest) {
        rateLimitService.check("PROFILE_CLICK", network(httpRequest) + "|" + publicSlug,
            ratePolicy.clicks, Duration.ofMinutes(1));
        int count = tenSignalService.incrementProfileClick(publicSlug);
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
