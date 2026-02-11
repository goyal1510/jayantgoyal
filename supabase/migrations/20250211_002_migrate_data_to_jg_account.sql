-- =============================================================================
-- Migration: Backfill jg_account.profiles from auth.users + portfolio.profile
-- Date: 2025-02-11
-- Description: One-time data migration. Populates profiles from existing users.
-- =============================================================================

INSERT INTO jg_account.profiles (user_id, first_name, last_name, role, terms_accepted, terms_accepted_at, created_at)
SELECT
  u.id AS user_id,
  COALESCE(u.raw_user_meta_data ->> 'first_name', '') AS first_name,
  COALESCE(u.raw_user_meta_data ->> 'last_name', '') AS last_name,
  COALESCE(p.role::text, 'user')::jg_account.user_role AS role,
  COALESCE((u.raw_user_meta_data ->> 'terms_accepted')::boolean, FALSE) AS terms_accepted,
  (u.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz AS terms_accepted_at,
  u.created_at
FROM auth.users u
LEFT JOIN portfolio.profile p ON p.user_id = u.id
ON CONFLICT (user_id) DO NOTHING;
