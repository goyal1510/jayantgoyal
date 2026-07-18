-- Trigger functions should not be exposed via PostgREST
-- Revoke execute from public roles so PostgREST skips them
REVOKE EXECUTE ON FUNCTION jg_app.handle_soft_delete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION jg_app.update_parent_child_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION jg_app.validate_file_type() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION jg_app.update_updated_at() FROM anon, authenticated;
-- Also notify PostgREST to reload
NOTIFY pgrst, 'reload schema';
