package com.seenly.backend.service;

import com.seenly.backend.entity.Seenly;
import com.seenly.backend.entity.User;
import com.seenly.backend.exception.OwnerAuthenticationException;
import com.seenly.backend.repository.SeenlyRepository;
import com.seenly.backend.repository.UserRepository;
import com.seenly.backend.observability.AuditEvent;
import com.seenly.backend.observability.AuditLogService;
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
    private final OwnerSessionService ownerSessionService;
    private final AuditLogService auditLogService;

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
        auditLogService.record(AuditEvent.ACCOUNT_DELETED, "success");
    }

    private Seenly getSeenlyFromToken(String ownerToken) {
        return ownerSessionService.authenticate(ownerToken);
    }

    private void validateOwnerToken(String ownerToken) {
        if (ownerToken == null || ownerToken.trim().isEmpty()) {
            throw new OwnerAuthenticationException("A valid owner token is required.");
        }
    }
}
