-- Remove raw_user_meta_data references for first_name/last_name from handle_new_user.
-- Names are now collected explicitly in the signup form and saved via the app layer.
CREATE OR REPLACE FUNCTION "jg_account"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO jg_account.profiles (user_id, first_name, last_name, terms_accepted)
  VALUES (
    NEW.id,
    '',
    '',
    FALSE
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'jg_account.handle_new_user failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
