-- V7: Add preferred_locale to seenly (TenSignal profile) and users
-- Default is NULL to distinguish missing preference from explicit 'en' or 'tr'
ALTER TABLE seenlys ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(10) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(10) DEFAULT NULL;
