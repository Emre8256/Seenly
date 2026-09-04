package com.seenly.backend.service;

import com.seenly.backend.constant.AppConstants;
import com.seenly.backend.dto.ResultSnapshotDto;
import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import com.seenly.backend.exception.ResourceNotFoundException;
import com.seenly.backend.repository.ResponseSessionRepository;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final SeenlyRepository seenlyRepository;
    private final UserRepository userRepository;
    private final TokenHashingService tokenHashingService;
    private final SnapshotMapperService snapshotMapperService;

    /**
     * Activates Plus subscription on the user account and uncaps the Seenly profile.
     */
    @Transactional
    public ResultSnapshotDto subscribePlus(String ownerToken) {
        validateOwnerToken(ownerToken);
        Seenly seenly = getSeenlyFromToken(ownerToken);
        User user = getOrCreateUser(seenly);

        user.setIsPremium(true);
        userRepository.save(user);

        seenly.setCapped(false);
        seenlyRepository.save(seenly);

        return snapshotMapperService.toDto(seenly.getResultSnapshot());
    }

    /**
     * Adds purchased extra response capacity to the user account and uncaps if appropriate.
     */
    @Transactional
    public ResultSnapshotDto buyPack(String ownerToken, int amount) {
        validateOwnerToken(ownerToken);

        if (!AppConstants.ALLOWED_PACK_AMOUNTS.contains(amount)) {
            throw new IllegalArgumentException("Invalid amount. Allowed amounts: 100, 250, 500.");
        }

        Seenly seenly = getSeenlyFromToken(ownerToken);
        User user = getOrCreateUser(seenly);

        int currentExtra = user.getPurchasedExtraCapacity() != null ? user.getPurchasedExtraCapacity() : 0;
        user.setPurchasedExtraCapacity(currentExtra + amount);
        userRepository.save(user);

        int totalAllowed = user.getBaseFormCapacity() + user.getPurchasedExtraCapacity();
        if (seenly.getResponseCount() < totalAllowed) {
            seenly.setCapped(false);
        }
        seenlyRepository.save(seenly);

        return snapshotMapperService.toDto(seenly.getResultSnapshot());
    }

    /**
     * Completely deletes the user account, associated Seenly profiles, and cascade-removes data.
     */
    @Transactional
    public void deleteAccount(String ownerToken) {
        validateOwnerToken(ownerToken);
        Seenly seenly = getSeenlyFromToken(ownerToken);
        User user = seenly.getUser();

        if (user != null) {
            // Find and delete all Seenly profiles belonging to this user
            List<Seenly> userSeenlys = seenlyRepository.findByUser(user);
            for (Seenly s : userSeenlys) {
                seenlyRepository.delete(s);
            }

            // Delete the user
            userRepository.delete(user);
        } else {
            seenlyRepository.delete(seenly);
        }
    }

    private User getOrCreateUser(Seenly seenly) {
        User user = seenly.getUser();
        if (user == null) {
            user = User.builder()
                .email(seenly.getEmail())
                .isPremium(false)
                .baseFormCapacity(AppConstants.DEFAULT_BASE_CAPACITY)
                .purchasedExtraCapacity(0)
                .build();
            user = userRepository.save(user);
            seenly.setUser(user);
            seenlyRepository.save(seenly);
        }
        return user;
    }

    private Seenly getSeenlyFromToken(String ownerToken) {
        String tokenHash = tokenHashingService.hashToken(ownerToken);
        return seenlyRepository.findByOwnerTokenHash(tokenHash)
            .orElseThrow(() -> new ResourceNotFoundException("Seenly profile not found for the provided token."));
    }

    private void validateOwnerToken(String ownerToken) {
        if (ownerToken == null || ownerToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner token is required.");
        }
    }
}
