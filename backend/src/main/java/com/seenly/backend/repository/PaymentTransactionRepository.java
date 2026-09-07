package com.seenly.backend.repository;

import com.seenly.backend.entity.PaymentTransaction;
import com.seenly.backend.payment.EntitlementType;
import com.seenly.backend.payment.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PaymentTransaction p where p.id = :id")
    Optional<PaymentTransaction> findByIdForUpdate(@Param("id") UUID id);

    Optional<PaymentTransaction> findByProviderAndProviderTransactionId(String provider, String providerTransactionId);

    List<PaymentTransaction> findByOwnerAccountIdAndEntitlementTypeAndStatusAndIdNotOrderByCreatedAtDesc(
        UUID ownerAccountId, EntitlementType entitlementType, PaymentStatus status, UUID excludedId);
}
