-- Add master_enabled to user_notification_preferences (default true, preserves existing preferences)
ALTER TABLE user_notification_preferences ADD COLUMN IF NOT EXISTS master_enabled boolean NOT NULL DEFAULT true;

-- Add user_id to email_outbox for authoritative delivery-time preference checking
ALTER TABLE email_outbox ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_email_outbox_user_id ON email_outbox(user_id);
