-- V8: Update default free capacity from 3 to 20 and elevate existing users without resetting purchased capacity

-- 1. Alter default column value for future user accounts
ALTER TABLE users ALTER COLUMN base_form_capacity SET DEFAULT 20;

-- 2. Elevate existing users who have base_form_capacity < 20 to the new 20 free evaluations baseline
-- This preserves all previously purchased extra capacity and usage history.
UPDATE users 
SET base_form_capacity = 20 
WHERE base_form_capacity < 20;

-- 3. Uncap profiles that were previously capped under the old 3-evaluation threshold
-- but are now within their new total allowed capacity (base + purchased).
UPDATE seenlys s
SET is_capped = false
FROM users u
WHERE s.user_id = u.id
  AND (u.is_premium = true OR s.response_count < (u.base_form_capacity + COALESCE(u.purchased_extra_capacity, 0)));
