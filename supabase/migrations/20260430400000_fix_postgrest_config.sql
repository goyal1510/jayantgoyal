-- Force update PostgREST configuration
-- In Supabase, the config is stored in supabase_functions schema or read from project settings
-- Let's try the NOTIFY approach with explicit config reload
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,graphql_public,portfolio,jg_account,jg_app';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
