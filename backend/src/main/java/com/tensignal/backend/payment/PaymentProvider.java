package com.tensignal.backend.payment;

public interface PaymentProvider {
    String providerCode();

    ProviderCheckout createCheckout(ProviderCheckoutRequest request);

    VerifiedPaymentEvent verifyAndParseWebhook(String signature, byte[] payload);
}
