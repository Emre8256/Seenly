-- Supports bounded expiry-ordered cleanup without sorting/scanning the full rate-limit table.
CREATE INDEX IF NOT EXISTS idx_rate_limit_expires_at ON rate_limit_buckets(expires_at);

-- OTP and verification-grant cleanup use the same expiry-ordered bounded access pattern.
CREATE INDEX IF NOT EXISTS idx_otp_challenge_expires_at ON otp_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_grant_expires_at ON verification_grants(expires_at);
