package com.tensignal.backend.repository;

import com.tensignal.backend.entity.PaymentProviderEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.Optional;

public interface PaymentProviderEventRepository extends JpaRepository<PaymentProviderEvent, UUID> {
    boolean existsByProviderAndProviderEventId(String provider, String providerEventId);
    Optional<PaymentProviderEvent> findByProviderAndProviderEventId(String provider, String providerEventId);
}
