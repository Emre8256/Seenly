package com.tensignal.backend.payment;

import com.tensignal.backend.exception.PaymentProviderUnavailableException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "disabled", matchIfMissing = true)
public class DisabledPaymentProvider implements PaymentProvider {
    @Override
    public String providerCode() {
        return "disabled";
    }

    @Override
    public ProviderCheckout createCheckout(ProviderCheckoutRequest request) {
        throw unavailable();
    }

    @Override
    public VerifiedPaymentEvent verifyAndParseWebhook(String signature, byte[] payload) {
        throw unavailable();
    }

    private PaymentProviderUnavailableException unavailable() {
        return new PaymentProviderUnavailableException("Payment checkout is not currently available.");
    }
}
