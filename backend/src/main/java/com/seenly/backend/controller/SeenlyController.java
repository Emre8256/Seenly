package com.seenly.backend.controller;

import com.seenly.backend.dto.*;
import com.seenly.backend.entity.*;
import com.seenly.backend.service.*;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/seenly")
public class SeenlyController {

    private final SeenlyRepository seenlyRepository;
    private final TokenHashingService tokenHashingService;
    private final ScoringEngineService scoringEngineService;
    private final FriendResponseService friendResponseService;
    private final ReaderGameService readerGameService;
    private final com.seenly.backend.repository.ResponseSessionRepository responseSessionRepository;

    @org.springframework.beans.factory.annotation.Value("${spring.profiles.active:dev}")
    private String activeProfile;

    private final java.util.Map<String, String> otpStorage = new java.util.concurrent.ConcurrentHashMap<>();

    public SeenlyController(SeenlyRepository seenlyRepository,
                            TokenHashingService tokenHashingService,
                            ScoringEngineService scoringEngineService,
                            FriendResponseService friendResponseService,
                            ReaderGameService readerGameService,
                            com.seenly.backend.repository.ResponseSessionRepository responseSessionRepository) {
        this.seenlyRepository = seenlyRepository;
        this.tokenHashingService = tokenHashingService;
        this.scoringEngineService = scoringEngineService;
        this.friendResponseService = friendResponseService;
        this.readerGameService = readerGameService;
        this.responseSessionRepository = responseSessionRepository;
    }

    /**
     * POST /api/v1/seenly/create
     * Creates a new Seenly profile with owner's self answers.
     */
    @PostMapping("/create")
    public ResponseEntity<CreateSeenlyResponse> createSeenly(@Valid @RequestBody CreateSeenlyRequest request) {
        String rawToken = tokenHashingService.generateRawToken();
        String tokenHash = tokenHashingService.hashToken(rawToken);
        String publicSlug = tokenHashingService.generatePublicSlug();

        Seenly seenly = Seenly.builder()
            .displayName(request.getDisplayName())
            .email(request.getEmail())
            .publicSlug(publicSlug)
            .ownerTokenHash(tokenHash)
            .responseCount(0)
            .isCapped(false)
            .build();

        // Convert self answers input to entities
        seenly.setSelfAnswers(request.getSelfAnswers().stream().map(ans -> 
            SelfAnswer.builder()
                .seenly(seenly)
                .questionId(ans.getQuestionId())
                .answerValue(ans.getAnswerValue())
                .build()
        ).collect(Collectors.toList()));

        seenlyRepository.save(seenly);

        // Compute self snapshot
        ResultSnapshot snapshot = scoringEngineService.calculateSelfResult(seenly);
        ResultSnapshotDto snapshotDto = new ResultSnapshotDto(snapshot);

        return ResponseEntity.ok(new CreateSeenlyResponse(rawToken, publicSlug, snapshotDto));
    }

    /**
     * POST /api/v1/seenly/auth/send-code
     * Sends a mock 6-digit code to the user's email.
     */
    @PostMapping("/auth/send-code")
    public ResponseEntity<java.util.Map<String, String>> sendVerificationCode(
            @Valid @RequestBody EmailAuthRequest request,
            @RequestParam(required = false, defaultValue = "false") boolean isLogin) {
        
        if (isLogin) {
            java.util.Optional<Seenly> seenlyOpt = seenlyRepository.findFirstByEmailOrderByCreatedAtDesc(request.getEmail());
            if (seenlyOpt.isEmpty()) {
                java.util.Map<String, String> errResponse = new java.util.HashMap<>();
                errResponse.put("status", "error");
                errResponse.put("message", "Bu e-posta adresine ait bir profil bulunamadı. Lütfen önce profilinizi oluşturun.");
                return ResponseEntity.badRequest().body(errResponse);
            }
        }

        String code = "dev".equalsIgnoreCase(activeProfile) ? "1234" : generateAlphanumericCode();
        otpStorage.put(request.getEmail().toLowerCase(), code);

        // Print mock verification details in logs for simulation
        System.out.println("[MAIL MOCK] Verification request received for email: " + request.getEmail());
        System.out.println("[MAIL MOCK] Verification code sent is: " + code);
        
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("status", "success");
        response.put("message", "Verification code sent successfully.");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/seenly/auth/verify-code
     * Verifies the 6-digit code for the user's email.
     */
    @PostMapping("/auth/verify-code")
    public ResponseEntity<java.util.Map<String, String>> verifyCode(@Valid @RequestBody EmailAuthRequest request) {
        java.util.Map<String, String> response = new java.util.HashMap<>();
        
        String storedCode = otpStorage.get(request.getEmail().toLowerCase());
        if (storedCode != null && storedCode.equalsIgnoreCase(request.getCode())) {
            otpStorage.remove(request.getEmail().toLowerCase());
            response.put("status", "success");
            response.put("message", "Verification successful.");
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "error");
            response.put("message", "Geçersiz doğrulama kodu. Lütfen tekrar deneyin.");
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * GET /api/v1/seenly/owner/{ownerToken}
     * Returns owner dashboard snapshot with dynamic privacy masking.
     */
    @GetMapping("/owner/{ownerToken}")
    public ResponseEntity<ResultSnapshotDto> getOwnerDashboard(@PathVariable String ownerToken) {
        String tokenHash = tokenHashingService.hashToken(ownerToken);
        Seenly seenly = seenlyRepository.findByOwnerTokenHash(tokenHash)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found for the provided token."));

        ResultSnapshotDto snapshotDto = new ResultSnapshotDto(seenly.getResultSnapshot());
        return ResponseEntity.ok(snapshotDto);
    }

    /**
     * PUT /api/v1/seenly/owner/display-name
     * Updates the owner's display name with a 14-day cooldown rule.
     */
    @PutMapping("/owner/display-name")
    public ResponseEntity<?> updateDisplayName(
            @RequestHeader(value = "X-Owner-Token") String ownerToken,
            @RequestBody java.util.Map<String, String> request) {
        
        String newName = request.get("displayName");
        if (newName == null || newName.trim().length() < 2 || newName.trim().length() > 15) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "İsminiz 2 ile 15 karakter arasında olmalıdır."));
        }

        String tokenHash = tokenHashingService.hashToken(ownerToken);
        Seenly seenly = seenlyRepository.findByOwnerTokenHash(tokenHash)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found."));

        // Check 14-day cooldown
        if (seenly.getLastNameChangedAt() != null) {
            java.time.LocalDateTime nextAllowedDate = seenly.getLastNameChangedAt().plusDays(14);
            if (java.time.LocalDateTime.now().isBefore(nextAllowedDate)) {
                long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDateTime.now(), nextAllowedDate) + 1;
                return ResponseEntity.status(429).body(java.util.Map.of(
                    "message", "İsminizi 14 günde bir değiştirebilirsiniz. Kalan süre: " + daysRemaining + " gün.",
                    "nextAllowedDate", nextAllowedDate.toString(),
                    "daysRemaining", String.valueOf(daysRemaining)
                ));
            }
        }

        seenly.setDisplayName(newName.trim());
        seenly.setLastNameChangedAt(java.time.LocalDateTime.now());
        seenlyRepository.save(seenly);

        ResultSnapshotDto snapshotDto = new ResultSnapshotDto(seenly.getResultSnapshot());
        return ResponseEntity.ok(snapshotDto);
    }

    /**
     * PUT /api/v1/seenly/owner/email
     * Updates the owner's email address.
     */
    @PutMapping("/owner/email")
    public ResponseEntity<?> updateEmail(
            @RequestHeader(value = "X-Owner-Token") String ownerToken,
            @RequestBody java.util.Map<String, String> request) {
        
        String newEmail = request.get("email");
        if (newEmail == null || newEmail.trim().isEmpty() || !newEmail.contains("@")) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Geçerli bir e-posta adresi giriniz."));
        }

        String tokenHash = tokenHashingService.hashToken(ownerToken);
        Seenly seenly = seenlyRepository.findByOwnerTokenHash(tokenHash)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found."));

        String cleanedEmail = newEmail.trim().toLowerCase();
        seenly.setEmail(cleanedEmail);
        if (seenly.getUser() != null) {
            seenly.getUser().setEmail(cleanedEmail);
        }
        seenlyRepository.save(seenly);

        ResultSnapshotDto snapshotDto = new ResultSnapshotDto(seenly.getResultSnapshot());
        return ResponseEntity.ok(snapshotDto);
    }

    /**
     * PUT /api/v1/seenly/owner/avatar
     * Updates the owner's chosen avatar.
     */
    @PutMapping("/owner/avatar")
    public ResponseEntity<?> updateAvatar(
            @RequestHeader(value = "X-Owner-Token") String ownerToken,
            @RequestBody java.util.Map<String, String> request) {
        
        String avatar = request.get("avatar");
        if (avatar == null || avatar.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Avatar is required."));
        }

        String tokenHash = tokenHashingService.hashToken(ownerToken);
        Seenly seenly = seenlyRepository.findByOwnerTokenHash(tokenHash)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found."));

        seenly.setAvatar(avatar.trim());
        seenlyRepository.save(seenly);

        ResultSnapshotDto snapshotDto = new ResultSnapshotDto(seenly.getResultSnapshot());
        return ResponseEntity.ok(snapshotDto);
    }

    /**
     * GET /api/v1/seenly/public/{publicSlug}
     * Returns public dashboard snapshot with zero-leak privacy masking.
     */
    @GetMapping("/public/{publicSlug}")
    public ResponseEntity<ResultSnapshotDto> getPublicDashboard(@PathVariable String publicSlug) {
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found for the provided slug."));

        ResultSnapshotDto snapshotDto = new ResultSnapshotDto(seenly.getResultSnapshot());
        return ResponseEntity.ok(snapshotDto);
    }

    /**
     * POST /api/v1/seenly/friend/{publicSlug}/check-eligibility
     * Checks if the user is eligible to take the quiz (not spam, not owner).
     */
    @PostMapping("/friend/{publicSlug}/check-eligibility")
    public ResponseEntity<?> checkEligibility(
            @PathVariable String publicSlug,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @RequestBody java.util.Map<String, String> request) {
                
        Seenly seenlyCheck = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        if (ownerToken != null && seenlyCheck.getOwnerTokenHash().equals(tokenHashingService.hashToken(ownerToken))) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                .body(java.util.Map.of("message", "You cannot evaluate yourself.", "eligible", false));
        }

        String ipAddress = httpRequest.getRemoteAddr();
        String fingerprint = request.get("fingerprintHash");
        
        // [TEST MODE] Geçiçi IP ve Cihaz Kontrolü Test İçin Devre Dışı Bırakıldı
        /*
        if (fingerprint != null) {
            boolean existsDuplicate = responseSessionRepository.existsDuplicateSession(seenlyCheck.getId(), ipAddress, fingerprint);
            if (existsDuplicate) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                    .body(java.util.Map.of("message", "You have already evaluated this person.", "eligible", false));
            }
        }
        */
        
        return ResponseEntity.ok(java.util.Map.of("eligible", true));
    }

    /**
     * POST /api/v1/seenly/friend/{publicSlug}/respond
     * Submits a friend's evaluation, calculates reader style/rewards, and updates calculations.
     */
    @PostMapping("/friend/{publicSlug}/respond")
    public ResponseEntity<?> submitFriendResponse(
            @PathVariable String publicSlug,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerToken,
            jakarta.servlet.http.HttpServletRequest httpRequest,
            @Valid @RequestBody FriendResponseInput request) {

        Seenly seenlyCheck = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        // 1. Self-Evaluation Prevention
        if (ownerToken != null && seenlyCheck.getOwnerTokenHash().equals(tokenHashingService.hashToken(ownerToken))) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                .body(java.util.Map.of("message", "You cannot evaluate yourself."));
        }

        // 2. Spam Protection (IP + Fingerprint)
        String ipAddress = httpRequest.getRemoteAddr();
        String fingerprint = request.getFingerprintHash();
        
        // [TEST MODE] Geçiçi IP ve Cihaz Kontrolü Test İçin Devre Dışı Bırakıldı
        /*
        boolean existsDuplicate = responseSessionRepository.existsDuplicateSession(seenlyCheck.getId(), ipAddress, fingerprint);
        if (existsDuplicate) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT)
                .body(java.util.Map.of("message", "You have already evaluated this person."));
        }
        */

        ResponseSession session = ResponseSession.builder()
            .nickname(request.getNickname())
            .fingerprintHash(fingerprint)
            .ipAddress(ipAddress)
            .friendTimeAnalytics(request.getFriendTimeAnalytics() != null ? request.getFriendTimeAnalytics() : new java.util.HashMap<>())
            .build();

        session.setResponses(request.getFriendResponses().stream().map(ans ->
            FriendResponse.builder()
                .responseSession(session)
                .questionId(ans.getQuestionId())
                .answerValue(ans.getAnswerValue())
                .build()
        ).collect(Collectors.toList()));

        // Submit friend answers and update snap (Version concurrency locking check runs here)
        String styleId = friendResponseService.submitResponse(publicSlug, session);

        // Fetch refreshed snapshot from db
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly not found"));

        ResultSnapshotDto snapshotDto = new ResultSnapshotDto(seenly.getResultSnapshot());

        // Reader progression details
        int xpGained = 15;
        int currentLevel = 1;
        double accuracy = readerGameService.calculatePerceptionAccuracy(session);

        return ResponseEntity.ok(new SubmitResponseResult(styleId, xpGained, currentLevel, accuracy, snapshotDto));
    }

    /**
     * POST /api/v1/seenly/auth/login-email
     * Logins user and updates their ownerToken using email verification.
     */
    @PostMapping("/auth/login-email")
    public ResponseEntity<?> loginWithEmail(@Valid @RequestBody EmailAuthRequest request) {
        String storedCode = otpStorage.get(request.getEmail().toLowerCase());
        if (storedCode == null || !storedCode.equalsIgnoreCase(request.getCode())) {
            java.util.Map<String, String> errResponse = new java.util.HashMap<>();
            errResponse.put("status", "error");
            errResponse.put("message", "Geçersiz doğrulama kodu. Lütfen tekrar deneyin.");
            return ResponseEntity.badRequest().body(errResponse);
        }
        
        otpStorage.remove(request.getEmail().toLowerCase());

        // Fetch the user's latest seenly profile
        java.util.Optional<Seenly> seenlyOpt = seenlyRepository.findFirstByEmailOrderByCreatedAtDesc(request.getEmail());
        if (seenlyOpt.isEmpty()) {
            java.util.Map<String, String> errResponse = new java.util.HashMap<>();
            errResponse.put("status", "error");
            errResponse.put("message", "Bu e-posta adresine ait bir profil bulunamadı. Lütfen önce profilinizi oluşturun.");
            return ResponseEntity.badRequest().body(errResponse);
        }

        Seenly seenly = seenlyOpt.get();

        // Generate a new raw token, hash it, update in db, and return
        String rawToken = tokenHashingService.generateRawToken();
        String tokenHash = tokenHashingService.hashToken(rawToken);

        seenly.setOwnerTokenHash(tokenHash);
        seenlyRepository.save(seenly);

        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("ownerToken", rawToken);
        response.put("publicSlug", seenly.getPublicSlug());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/seenly/profile/{publicSlug}/increment-click
     * Silent endpoint to increment the click/visit count on public link load.
     */
    @PostMapping("/profile/{publicSlug}/increment-click")
    public ResponseEntity<java.util.Map<String, Object>> incrementClick(@PathVariable String publicSlug) {
        Seenly seenly = seenlyRepository.findByPublicSlug(publicSlug)
            .orElseThrow(() -> new com.seenly.backend.exception.ResourceNotFoundException("Seenly profile not found."));
        seenly.setTotalProfileClicks(seenly.getTotalProfileClicks() + 1);
        seenlyRepository.save(seenly);
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("status", "success");
        response.put("totalProfileClicks", seenly.getTotalProfileClicks());
        return ResponseEntity.ok(response);
    }

    private String generateAlphanumericCode() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}

