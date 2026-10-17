package com.tensignal.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;

@JsonIgnoreProperties(ignoreUnknown = false)
public record CreateCheckoutRequest(
    @NotBlank @Size(max = 80) String productCode,
    Integer capacityAmount,
    Long amountMinor,
    String currency,
    Boolean premium
) {
    @AssertTrue(message = "Price, currency, capacity, and entitlement values must not be supplied by the client.")
    public boolean isServerOwnedCatalogOnly() {
        return capacityAmount == null && amountMinor == null && currency == null && premium == null;
    }
}
