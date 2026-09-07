CREATE TABLE users (
    id uuid PRIMARY KEY,
    email varchar(255),
    email_verified boolean NOT NULL DEFAULT false,
    is_premium boolean NOT NULL DEFAULT false,
    base_form_capacity integer NOT NULL DEFAULT 3,
    purchased_extra_capacity integer NOT NULL DEFAULT 0,
    created_at timestamp(6) NOT NULL,
    updated_at timestamp(6) NOT NULL,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE seenlys (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    public_slug varchar(255) NOT NULL,
    owner_token_hash varchar(255) NOT NULL,
    owner_token_expires_at timestamp(6) with time zone,
    owner_token_revoked_at timestamp(6) with time zone,
    display_name varchar(255) NOT NULL,
    email varchar(255),
    avatar varchar(255),
    last_name_changed_at timestamp(6),
    response_count integer NOT NULL DEFAULT 0,
    total_profile_clicks integer NOT NULL DEFAULT 0,
    is_capped boolean NOT NULL DEFAULT false,
    version bigint,
    created_at timestamp(6) NOT NULL,
    updated_at timestamp(6) NOT NULL,
    CONSTRAINT uk_seenlys_public_slug UNIQUE (public_slug),
    CONSTRAINT uk_seenlys_owner_token_hash UNIQUE (owner_token_hash)
);

CREATE INDEX idx_seenly_email ON seenlys(email);
CREATE INDEX idx_seenly_user_id ON seenlys(user_id);
CREATE INDEX idx_seenly_email_created_at ON seenlys(email, created_at);

CREATE TABLE self_answers (
    id uuid PRIMARY KEY,
    seenly_id uuid NOT NULL REFERENCES seenlys(id),
    question_id varchar(255) NOT NULL,
    answer_value integer NOT NULL,
    created_at timestamp(6) NOT NULL
);
CREATE INDEX idx_self_answer_seenly_id ON self_answers(seenly_id);

CREATE TABLE response_sessions (
    id uuid PRIMARY KEY,
    seenly_id uuid NOT NULL REFERENCES seenlys(id),
    nickname varchar(255),
    fingerprint_hash varchar(255) NOT NULL,
    ip_address varchar(255),
    created_at timestamp(6) NOT NULL,
    CONSTRAINT uk_response_target_fingerprint UNIQUE (seenly_id, fingerprint_hash)
);
CREATE INDEX idx_response_session_seenly_id ON response_sessions(seenly_id);
CREATE INDEX idx_session_dup_guard ON response_sessions(seenly_id, ip_address, fingerprint_hash);

CREATE TABLE friend_responses (
    id uuid PRIMARY KEY,
    response_session_id uuid NOT NULL REFERENCES response_sessions(id),
    question_id varchar(255) NOT NULL,
    answer_value integer NOT NULL,
    created_at timestamp(6) NOT NULL
);
CREATE INDEX idx_friend_response_session_id ON friend_responses(response_session_id);

CREATE TABLE response_session_time_analytics (
    session_id uuid NOT NULL REFERENCES response_sessions(id),
    signal_key varchar(255) NOT NULL,
    duration_ms integer,
    PRIMARY KEY (session_id, signal_key)
);

CREATE TABLE result_snapshots (
    id uuid PRIMARY KEY,
    seenly_id uuid NOT NULL,
    scoring_version varchar(255) NOT NULL DEFAULT 'v1.0',
    self_signature_id varchar(255) NOT NULL,
    self_family_id varchar(255) NOT NULL,
    outside_signature_id varchar(255),
    outside_family_id varchar(255),
    gap_pattern_id varchar(255),
    gap_strength varchar(255),
    confidence_band varchar(255) NOT NULL DEFAULT 'self_only',
    created_at timestamp(6) NOT NULL,
    updated_at timestamp(6) NOT NULL,
    CONSTRAINT uk_result_snapshot_seenly UNIQUE (seenly_id),
    CONSTRAINT fk_result_snapshot_seenly FOREIGN KEY (seenly_id) REFERENCES seenlys(id)
);
CREATE INDEX idx_result_snapshot_seenly_id ON result_snapshots(seenly_id);

CREATE TABLE otp_challenges (
    challenge_key varchar(180) PRIMARY KEY,
    email varchar(255) NOT NULL,
    purpose varchar(24) NOT NULL,
    owner_profile_id uuid,
    code_hash varchar(256) NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    resend_available_at timestamp(6) with time zone NOT NULL,
    failed_attempts integer NOT NULL,
    consumed_at timestamp(6) with time zone,
    version bigint,
    CONSTRAINT ck_otp_challenge_purpose CHECK (purpose IN ('REGISTER', 'LOGIN', 'EMAIL_CHANGE'))
);

CREATE TABLE verification_grants (
    token_hash varchar(64) PRIMARY KEY,
    email varchar(255) NOT NULL,
    purpose varchar(24) NOT NULL,
    owner_profile_id uuid,
    expires_at timestamp(6) with time zone NOT NULL,
    consumed_at timestamp(6) with time zone,
    version bigint,
    CONSTRAINT ck_verification_grant_purpose CHECK (purpose IN ('REGISTER', 'LOGIN', 'EMAIL_CHANGE'))
);

CREATE TABLE rate_limit_buckets (
    key_hash varchar(64) PRIMARY KEY,
    action varchar(40) NOT NULL,
    window_started_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    request_count integer NOT NULL,
    version bigint
);
