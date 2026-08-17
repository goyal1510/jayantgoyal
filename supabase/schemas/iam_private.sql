


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "iam_private";


ALTER SCHEMA "iam_private" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam_private"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into iam.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into iam.product_memberships (product_key, user_id)
  values ('auth', new.id)
  on conflict (product_key, user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "iam_private"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam_private"."has_capability"("p_capability_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(
    iam_private.user_has_capability((select auth.uid()), p_capability_key),
    false
  );
$$;


ALTER FUNCTION "iam_private"."has_capability"("p_capability_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam_private"."has_product_access"("p_product_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(
    iam_private.user_has_product_access((select auth.uid()), p_product_key),
    false
  );
$$;


ALTER FUNCTION "iam_private"."has_product_access"("p_product_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam_private"."is_active_game_participant"("p_session_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from studio.game_session_participants participant
    where participant.session_id = p_session_id
      and participant.user_id = (select auth.uid())
      and participant.left_at is null
  );
$$;


ALTER FUNCTION "iam_private"."is_active_game_participant"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam_private"."user_has_capability"("p_user_id" "uuid", "p_capability_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from iam.capabilities capability
    where capability.key = p_capability_key
      and iam_private.user_has_product_access(
        p_user_id,
        capability.product_key
      )
      and (
        exists (
        select 1
        from iam.product_role_assignments assignment
        join iam.product_memberships assignment_membership
          on assignment_membership.product_key = assignment.product_key
         and assignment_membership.user_id = assignment.user_id
        join iam.role_capabilities role_capability
          on role_capability.role_key = assignment.role_key
        where assignment.user_id = p_user_id
          and assignment_membership.status = 'active'
          and assignment_membership.valid_from <= now()
          and (
            assignment_membership.expires_at is null
            or assignment_membership.expires_at > now()
          )
          and role_capability.capability_key = capability.key
          and (assignment.expires_at is null or assignment.expires_at > now())
        )
        or exists (
          select 1
          from iam.workforce_role_assignments assignment
          join iam.workforce_memberships membership
            on membership.workforce_id = assignment.workforce_id
           and membership.user_id = assignment.user_id
          join iam.workforces workforce
            on workforce.id = assignment.workforce_id
          join iam.role_capabilities role_capability
            on role_capability.role_key = assignment.role_key
          where assignment.user_id = p_user_id
            and membership.status = 'active'
            and workforce.status = 'active'
            and (membership.expires_at is null or membership.expires_at > now())
            and (assignment.expires_at is null or assignment.expires_at > now())
            and role_capability.capability_key = capability.key
        )
      )
  );
$$;


ALTER FUNCTION "iam_private"."user_has_capability"("p_user_id" "uuid", "p_capability_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam_private"."user_has_product_access"("p_user_id" "uuid", "p_product_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from iam.product_memberships membership
    join iam.profiles profile on profile.user_id = membership.user_id
    join iam.products product on product.key = membership.product_key
    where membership.user_id = p_user_id
      and membership.product_key = p_product_key
      and membership.status = 'active'
      and membership.valid_from <= now()
      and (membership.expires_at is null or membership.expires_at > now())
      and profile.status = 'active'
      and product.status = 'active'
  );
$$;


ALTER FUNCTION "iam_private"."user_has_product_access"("p_user_id" "uuid", "p_product_key" "text") OWNER TO "postgres";


GRANT USAGE ON SCHEMA "iam_private" TO "authenticated";
GRANT USAGE ON SCHEMA "iam_private" TO "service_role";



REVOKE ALL ON FUNCTION "iam_private"."handle_new_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "iam_private"."has_capability"("p_capability_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam_private"."has_capability"("p_capability_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "iam_private"."has_capability"("p_capability_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "iam_private"."has_product_access"("p_product_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam_private"."has_product_access"("p_product_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "iam_private"."has_product_access"("p_product_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "iam_private"."is_active_game_participant"("p_session_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam_private"."is_active_game_participant"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "iam_private"."is_active_game_participant"("p_session_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "iam_private"."user_has_capability"("p_user_id" "uuid", "p_capability_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam_private"."user_has_capability"("p_user_id" "uuid", "p_capability_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "iam_private"."user_has_product_access"("p_user_id" "uuid", "p_product_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam_private"."user_has_product_access"("p_user_id" "uuid", "p_product_key" "text") TO "service_role";
