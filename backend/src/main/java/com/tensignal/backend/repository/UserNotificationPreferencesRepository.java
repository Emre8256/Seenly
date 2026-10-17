package com.tensignal.backend.repository;

import com.tensignal.backend.entity.UserNotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationPreferencesRepository extends JpaRepository<UserNotificationPreferences, UUID> {
    Optional<UserNotificationPreferences> findByUserId(UUID userId);
}
