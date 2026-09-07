package com.seenly.backend.payment;

public record ProviderCheckout(String providerCheckoutId, String checkoutUrl) {
    @Override
    public String toString() {
        return "ProviderCheckout[providerCheckoutId=<redacted>, checkoutUrl=<redacted>]";
    }
}
