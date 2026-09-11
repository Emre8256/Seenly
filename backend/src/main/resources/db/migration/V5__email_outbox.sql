-- Add last_activity_at to seenlys for authoritative inactivity tracking
ALTER TABLE seenlys ADD COLUMN IF NOT EXISTS last_activity_at timestamp(6);
UPDATE seenlys SET last_activity_at = created_at WHERE last_activity_at IS NULL;

-- Transactional email outbox
CREATE TABLE email_outbox (
    id uuid PRIMARY KEY,
    notification_type varchar(64) NOT NULL,
    recipient varchar(255) NOT NULL,
    recipient_hash varchar(64) NOT NULL,
    locale varchar(10) NOT NULL DEFAULT 'tr',
    payload_json text NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'PENDING',
    scheduled_at timestamp(6) with time zone NOT NULL,
    next_attempt_at timestamp(6) with time zone NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 5,
    expires_at timestamp(6) with time zone,
    sent_at timestamp(6) with time zone,
    provider_message_id varchar(255),
    idempotency_key varchar(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT uk_email_outbox_idempotency_key UNIQUE (idempotency_key)
);

CREATE INDEX idx_email_outbox_claim ON email_outbox(status, next_attempt_at);
CREATE INDEX idx_email_outbox_scheduled ON email_outbox(scheduled_at);
CREATE INDEX idx_email_outbox_recipient_hash ON email_outbox(recipient_hash);
CREATE INDEX idx_email_outbox_expires ON email_outbox(expires_at);

-- User notification preferences
CREATE TABLE user_notification_preferences (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    evaluations_enabled boolean NOT NULL DEFAULT true,
    reminders_enabled boolean NOT NULL DEFAULT true,
    card_changes_enabled boolean NOT NULL DEFAULT true,
    capacity_alerts_enabled boolean NOT NULL DEFAULT true,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT uk_user_notification_prefs_user UNIQUE (user_id),
    CONSTRAINT fk_user_notification_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
