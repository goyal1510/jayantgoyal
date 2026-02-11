-- =============================================================================
-- Migration: Drop portfolio.profile and migrate RLS policies to jg_account
-- Date: 2025-02-11
-- Description: Removes the old portfolio.profile table. Updates all portfolio
--   data table RLS policies to use jg_account.is_admin() instead of
--   portfolio.is_admin().
-- =============================================================================

-- Step 1: Migrate "Admin write access" policies on all portfolio data tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'hero','about','education','experience','skill_categories',
    'skills','tech_icons','projects','certificates','contact','nav_items'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admin write access" ON portfolio.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Admin write access" ON portfolio.%I '
      'USING (jg_account.is_admin()) '
      'WITH CHECK (jg_account.is_admin())', tbl
    );
  END LOOP;
END;
$$;

-- Step 2: Drop RLS policies on portfolio.profile
DROP POLICY IF EXISTS "Admins can read all profiles" ON portfolio.profile;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON portfolio.profile;
DROP POLICY IF EXISTS "Users can read own profile" ON portfolio.profile;

-- Step 3: Drop the table (cascades sequence)
DROP TABLE IF EXISTS portfolio.profile CASCADE;

-- Step 4: Drop the old helper function and enum
DROP FUNCTION IF EXISTS portfolio.is_admin();
DROP TYPE IF EXISTS portfolio.user_role;
