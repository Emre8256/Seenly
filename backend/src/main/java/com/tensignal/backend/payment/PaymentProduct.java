package com.tensignal.backend.payment;

import java.util.Locale;

public record PaymentProduct(
    String code,
    EntitlementType entitlementType,
    int capacityAmount,
    long amountMinor,
    boolean active
) {
    /**
     * Backward-compatible constructor for existing tests and legacy single-currency invocations.
     */
    public PaymentProduct(String code, EntitlementType entitlementType, int capacityAmount, long amountMinor, String currency, boolean active) {
        this(code, entitlementType, capacityAmount, amountMinor, active);
    }

    public String currency() {
        return "USD";
    }

    public String currency(String ignored) {
        return "USD";
    }

    public long amountMinorUsd() {
        return amountMinor;
    }

    public long amountMinor(String ignored) {
        return amountMinor;
    }

    public String formattedPrice() {
        return String.format(Locale.US, "$%.2f", amountMinor / 100.0);
    }

    public String formattedPrice(String ignored) {
        return formattedPrice();
    }
}

