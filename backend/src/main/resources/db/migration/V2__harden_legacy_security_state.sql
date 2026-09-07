-- This migration is also the first migration applied after baseline version 1
-- when adopting Flyway on a non-empty, Hibernate-managed Seenly database.

ALTER TABLE seenlys ADD COLUMN IF NOT EXISTS owner_token_expires_at timestamp(6) with time zone;
ALTER TABLE seenlys ADD COLUMN IF NOT EXISTS owner_token_revoked_at timestamp(6) with time zone;
ALTER TABLE seenlys ADD COLUMN IF NOT EXISTS version bigint;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_form_capacity integer NOT NULL DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS purchased_extra_capacity integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS otp_challenges (
    challenge_key varchar(180) PRIMARY KEY,
    email varchar(255) NOT NULL,
    purpose varchar(24) NOT NULL CHECK (purpose IN ('REGISTER', 'LOGIN', 'EMAIL_CHANGE')),
    owner_profile_id uuid,
    code_hash varchar(256) NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    resend_available_at timestamp(6) with time zone NOT NULL,
    failed_attempts integer NOT NULL,
    consumed_at timestamp(6) with time zone,
    version bigint
);

CREATE TABLE IF NOT EXISTS verification_grants (
    token_hash varchar(64) PRIMARY KEY,
    email varchar(255) NOT NULL,
    purpose varchar(24) NOT NULL CHECK (purpose IN ('REGISTER', 'LOGIN', 'EMAIL_CHANGE')),
    owner_profile_id uuid,
    expires_at timestamp(6) with time zone NOT NULL,
    consumed_at timestamp(6) with time zone,
    version bigint
);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    key_hash varchar(64) PRIMARY KEY,
    action varchar(40) NOT NULL,
    window_started_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    request_count integer NOT NULL,
    version bigint
);

ALTER TABLE response_sessions ADD COLUMN IF NOT EXISTS fingerprint_hash varchar(255);
ALTER TABLE response_sessions ADD COLUMN IF NOT EXISTS ip_address varchar(255);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM response_sessions
        WHERE fingerprint_hash IS NULL OR btrim(fingerprint_hash) = ''
    ) THEN
        RAISE EXCEPTION USING
            MESSAGE = 'Seenly migration blocked: response_sessions contains missing fingerprint values.',
            HINT = 'Restore the missing values from backup or define an audited remediation before retrying; no rows were deleted.';
    END IF;
END $$;

-- Values emitted by Seenly SHA-256 are unpadded base64url and exactly 43 chars.
-- Anything else is treated as a legacy raw value and pseudonymized in-place.
UPDATE response_sessions
SET fingerprint_hash = rtrim(translate(
    encode(sha256(convert_to('fingerprint:v1:' || lower(btrim(fingerprint_hash)), 'UTF8')), 'base64'),
    '+/', '-_'), '=')
WHERE fingerprint_hash !~ '^[A-Za-z0-9_-]{43}$';

UPDATE response_sessions
SET ip_address = rtrim(translate(
    encode(sha256(convert_to('network:v1:' || btrim(ip_address), 'UTF8')), 'base64'),
    '+/', '-_'), '=')
WHERE ip_address IS NOT NULL
  AND ip_address !~ '^[A-Za-z0-9_-]{43}$';

DO $$
DECLARE
    duplicate_groups bigint;
BEGIN
    SELECT count(*) INTO duplicate_groups
    FROM (
        SELECT seenly_id, fingerprint_hash
        FROM response_sessions
        GROUP BY seenly_id, fingerprint_hash
        HAVING count(*) > 1
    ) duplicates;
    IF duplicate_groups > 0 THEN
        RAISE EXCEPTION USING
            MESSAGE = format('Seenly migration blocked: %s duplicate target/fingerprint group(s) require review.', duplicate_groups),
            HINT = 'Do not delete responses blindly. Export affected session IDs, decide which records are legitimate, remediate from a backup, then rerun Flyway.';
    END IF;
END $$;

ALTER TABLE response_sessions ALTER COLUMN fingerprint_hash SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_response_target_fingerprint') THEN
        ALTER TABLE response_sessions
            ADD CONSTRAINT uk_response_target_fingerprint UNIQUE (seenly_id, fingerprint_hash);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_response_session_seenly_id ON response_sessions(seenly_id);
CREATE INDEX IF NOT EXISTS idx_session_dup_guard ON response_sessions(seenly_id, ip_address, fingerprint_hash);
