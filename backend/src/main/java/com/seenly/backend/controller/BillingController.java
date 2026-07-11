package com.seenly.backend.controller;

import com.seenly.backend.dto.ResultSnapshotDto;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import com.seenly.backend.service.TokenHashingService;
import com.seenly.backend.exception.ResourceNotFoundException;
import com.seenly.backend.repository.ResponseSessionRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final SeenlyRepository seenlyRepository;
    private final UserRepository userRepository;
    private final TokenHashingService tokenHashingService;
    private final ResponseSessionRepository responseSessionRepository;

    public BillingController(SeenlyRepository seenlyRepository,
                             UserRepository userRepository,
                             TokenHashingService tokenHashingService,
                             ResponseSessionRepository responseSessionRepository) {
        this.seenlyRepository = seenlyRepository;
        this.userRepository = userRepository;
        this.tokenHashingService = tokenHashingService;
        this.responseSessionRepository = responseSessionRepository;
    }

    private Seenly getSeenlyFromToken(String ownerToken) {
        String tokenHash = tokenHashingService.hashToken(ownerToken);
        return seenlyRepository.findByOwnerTokenHash(tokenHash)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found for the provided token."));
    }

    private User getOrCreateUser(Seenly seenly) {
        User user = seenly.getUser();
        if (user == null) {
            user = User.builder()
                .email(seenly.getEmail())
                .isPremium(false)
                .baseFormCapacity(3)
                .purchasedExtraCapacity(0)
                .build();
            user = userRepository.save(user);
            seenly.setUser(user);
            seenlyRepository.save(seenly);
        }
        return user;
    }

    @PostMapping("/subscribe-plus")
    public ResponseEntity<ResultSnapshotDto> subscribePlus(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerTokenHeader,
            @RequestParam(value = "ownerToken", required = false) String ownerTokenParam) {
        
        String ownerToken = ownerTokenHeader != null ? ownerTokenHeader : ownerTokenParam;
        if (ownerToken == null || ownerToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner token is required.");
        }

        Seenly seenly = getSeenlyFromToken(ownerToken);
        User user = getOrCreateUser(seenly);

        user.setIsPremium(true);
        userRepository.save(user);

        seenly.setCapped(false); // Uncap when premium
        seenlyRepository.save(seenly);

        return ResponseEntity.ok(new ResultSnapshotDto(seenly.getResultSnapshot()));
    }

    @PostMapping("/buy-pack")
    public ResponseEntity<ResultSnapshotDto> buyPack(
            @RequestParam int amount,
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerTokenHeader,
            @RequestParam(value = "ownerToken", required = false) String ownerTokenParam) {

        String ownerToken = ownerTokenHeader != null ? ownerTokenHeader : ownerTokenParam;
        if (ownerToken == null || ownerToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner token is required.");
        }

        if (amount != 100 && amount != 250 && amount != 500) {
            throw new IllegalArgumentException("Invalid amount. Allowed amounts: 100, 250, 500.");
        }

        Seenly seenly = getSeenlyFromToken(ownerToken);
        User user = getOrCreateUser(seenly);

        int currentExtra = user.getPurchasedExtraCapacity() != null ? user.getPurchasedExtraCapacity() : 0;
        user.setPurchasedExtraCapacity(currentExtra + amount);
        userRepository.save(user);

        // Check if we should uncap
        int totalAllowed = user.getBaseFormCapacity() + user.getPurchasedExtraCapacity();
        if (seenly.getResponseCount() < totalAllowed) {
            seenly.setCapped(false);
        }
        seenlyRepository.save(seenly);

        return ResponseEntity.ok(new ResultSnapshotDto(seenly.getResultSnapshot()));
    }

    @DeleteMapping("/delete-account")
    @Transactional
    public ResponseEntity<Void> deleteAccount(
            @RequestHeader(value = "X-Owner-Token", required = false) String ownerTokenHeader,
            @RequestParam(value = "ownerToken", required = false) String ownerTokenParam) {

        String ownerToken = ownerTokenHeader != null ? ownerTokenHeader : ownerTokenParam;
        if (ownerToken == null || ownerToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner token is required.");
        }

        Seenly seenly = getSeenlyFromToken(ownerToken);
        User user = seenly.getUser();

        if (user != null) {
            // Nullify any ResponseSession reader_id references pointing to this user
            responseSessionRepository.nullifyReaderReferences(user);

            // Find all Seenly profiles associated with this user
            java.util.List<Seenly> userSeenlys = seenlyRepository.findByUser(user);
            for (Seenly s : userSeenlys) {
                seenlyRepository.delete(s);
            }

            // Delete the user (this cascade deletes ReaderProfile -> xpTransactions)
            userRepository.delete(user);
        } else {
            // If user is null, just delete this Seenly profile
            seenlyRepository.delete(seenly);
        }

        return ResponseEntity.ok().build();
    }
}
