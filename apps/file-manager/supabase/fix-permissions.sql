-- Fix permissions for fmanager schema and functions
-- This ensures authenticated users can execute functions and access tables

-- Grant schema usage
GRANT USAGE ON SCHEMA fmanager TO anon, authenticated, service_role;

-- Grant table permissions (RLS will still enforce row-level security)
GRANT SELECT, INSERT, UPDATE, DELETE ON fmanager.files TO authenticated;
GRANT SELECT ON fmanager.file_type_categories TO authenticated;

-- Grant execute permissions on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA fmanager TO anon, authenticated, service_role;

-- Set default privileges for future functions
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA fmanager
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA fmanager
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
