-- Tighten commerce analytics event grants after default schema grants.
-- Authenticated users may read only through the admin RLS policy; event writes
-- stay service-role-only from server-side analytics helpers.

REVOKE ALL ON TABLE jg_app.commerce_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_events FROM authenticated;

GRANT SELECT ON TABLE jg_app.commerce_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.commerce_events TO service_role;
