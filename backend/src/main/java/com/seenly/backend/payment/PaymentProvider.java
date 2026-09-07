package com.seenly.backend.payment;

public interface PaymentProvider {
    String providerCode();

    ProviderCheckout createCheckout(ProviderCheckoutRequest request);

    VerifiedPaymentEvent verifyAndParseWebhook(String signature, byte[] payload);
}
