package com.seenly.backend.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

@Component
public class ApplicationMetrics {
    private static final Set<String> RATE_POLICIES = Set.of(
        "REGISTER", "OTP_SEND_NETWORK", "OTP_SEND_EMAIL", "OTP_VERIFY", "OTP_LOGIN", "LOGOUT",
        "OWNER_NAME", "OWNER_EMAIL", "OWNER_AVATAR", "PUBLIC_PROFILE", "ELIGIBILITY", "SUBMIT_NETWORK",
        "SUBMIT_TARGET_NETWORK", "PROFILE_CLICK", "BILLING_CHECKOUT", "BILLING_STATUS", "ACCOUNT_DELETE");
    private final MeterRegistry registry;

    public ApplicationMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void otpRequest(String purpose) { increment("seenly.auth.otp.requests", "purpose", enumTag(purpose)); }
    public void otpVerification(String purpose, String outcome) {
        increment("seenly.auth.otp.verifications", "purpose", enumTag(purpose), "outcome", outcomeTag(outcome));
    }
    public void login(String outcome) { increment("seenly.auth.logins", "outcome", outcomeTag(outcome)); }
    public void participantSubmission(String outcome) {
        increment("seenly.participant.submissions", "outcome", submissionOutcome(outcome));
    }
    public void rateLimitTriggered(String policy) {
        increment("seenly.security.rate_limits", "policy", RATE_POLICIES.contains(policy) ? policy : "OTHER");
    }
    public void checkout(String outcome) { increment("seenly.payment.checkouts", "outcome", outcomeTag(outcome)); }
    public void paymentWebhook(String eventType, String outcome) {
        increment("seenly.payment.webhooks", "event_type", enumTag(eventType), "outcome", webhookOutcome(outcome));
    }
    public void entitlement(String entitlement, String outcome) {
        increment("seenly.payment.entitlements", "type", enumTag(entitlement), "outcome", outcomeTag(outcome));
    }
    public void resilienceFailure(String type) {
        increment("seenly.resilience.failures", "type", resilienceType(type));
    }
    public void cleanup(String type, String outcome) {
        increment("seenly.cleanup.runs", "type", cleanupType(type), "outcome", outcomeTag(outcome));
    }

    public void emailSent(String type) {
        increment("email.sent", "notification_type", enumTag(type));
    }

    public void emailFailed(String type) {
        increment("email.failed", "notification_type", enumTag(type));
    }

    public void emailRetry(String type) {
        increment("email.retry", "notification_type", enumTag(type));
    }

    public void emailSkipped(String type, String reason) {
        increment("email.skipped", "notification_type", enumTag(type), "reason", reason);
    }

    public void emailProviderDisabled(String type) {
        increment("email.provider.disabled", "notification_type", enumTag(type));
    }

    private void increment(String name, String... tags) {
        Counter.builder(name).tags(tags).register(registry).increment();
    }

    private String outcomeTag(String value) {
        return "success".equalsIgnoreCase(value) ? "success" : "failure";
    }

    private String submissionOutcome(String value) {
        return Set.of("accepted", "duplicate", "rejected", "capacity_exhausted").contains(value)
            ? value : "rejected";
    }

    private String webhookOutcome(String value) {
        return Set.of("accepted", "duplicate", "rejected", "ignored").contains(value) ? value : "rejected";
    }

    private String enumTag(String value) {
        if (value == null || !value.matches("[A-Za-z0-9_]{1,40}")) return "UNKNOWN";
        return value.toUpperCase(Locale.ROOT);
    }

    private String resilienceType(String value) {
        return Set.of("database", "smtp", "payment_provider", "webhook", "transaction", "concurrency")
            .contains(value) ? value : "other";
    }

    private String cleanupType(String value) {
        return Set.of("rate_limit", "otp", "grant").contains(value) ? value : "other";
    }
}
