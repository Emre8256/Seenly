package com.seenly.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RateLimitPolicy {
    @Value("${app.rate-limit.otp-send-per-email:5}") public int otpSendPerEmail;
    @Value("${app.rate-limit.otp-send-per-network:20}") public int otpSendPerNetwork;
    @Value("${app.rate-limit.otp-attempts:10}") public int otpAttempts;
    @Value("${app.rate-limit.registration:5}") public int registration;
    @Value("${app.rate-limit.eligibility:60}") public int eligibility;
    @Value("${app.rate-limit.submission-per-target-network:12}") public int submissionPerTargetNetwork;
    @Value("${app.rate-limit.submission-per-network:30}") public int submissionPerNetwork;
    @Value("${app.rate-limit.clicks:30}") public int clicks;
    @Value("${app.rate-limit.owner-mutations:10}") public int ownerMutations;
    @Value("${app.rate-limit.public-reads:120}") public int publicReads;
}
