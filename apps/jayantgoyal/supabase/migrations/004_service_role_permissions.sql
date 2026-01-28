-- Service Role Permissions for Portfolio Schema
-- The service_role needs explicit USAGE permission on custom schemas

-- Grant schema usage to service_role
GRANT USAGE ON SCHEMA portfolio TO service_role;

-- Grant all privileges on all existing tables to service_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA portfolio TO service_role;

-- Grant privileges on future tables to service_role
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio GRANT ALL PRIVILEGES ON TABLES TO service_role;

-- Grant execute on all functions in the schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA portfolio TO service_role;

-- Grant usage on all sequences (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA portfolio TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio GRANT USAGE, SELECT ON SEQUENCES TO service_role;
