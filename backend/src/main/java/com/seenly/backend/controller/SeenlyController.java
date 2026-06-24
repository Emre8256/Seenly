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

    public SeenlyController(SeenlyRepository seenlyRepository,
                            TokenHashingService tokenHashingService,
                            ScoringEngineService scoringEngineService,
                            FriendResponseService friendResponseService,
                            ReaderGameService readerGameService) {
        this.seenlyRepository = seenlyRepository;
        this.tokenHashingService = tokenHashingService;
        this.scoringEngineService = scoringEngineService;
        this.friendResponseService = friendResponseService;
        this.readerGameService = readerGameService;
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

        // Print mock verification details in logs for simulation
        System.out.println("[MAIL MOCK] Verification request received for email: " + request.getEmail());
        System.out.println("[MAIL MOCK] Verification code sent is: 123456");
        
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
        
        if ("123456".equals(request.getCode())) {
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
     * POST /api/v1/seenly/friend/{publicSlug}/respond
     * Submits a friend's evaluation, calculates reader style/rewards, and updates calculations.
     */
    @PostMapping("/friend/{publicSlug}/respond")
    public ResponseEntity<SubmitResponseResult> submitFriendResponse(
            @PathVariable String publicSlug,
            @Valid @RequestBody FriendResponseInput request) {

        ResponseSession session = ResponseSession.builder()
            .nickname(request.getNickname())
            .fingerprintHash(request.getFingerprintHash())
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
        if (!"123456".equals(request.getCode())) {
            java.util.Map<String, String> errResponse = new java.util.HashMap<>();
            errResponse.put("status", "error");
            errResponse.put("message", "Geçersiz doğrulama kodu. Lütfen tekrar deneyin.");
            return ResponseEntity.badRequest().body(errResponse);
        }

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
}

