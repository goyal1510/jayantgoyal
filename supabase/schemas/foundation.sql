


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


CREATE SCHEMA IF NOT EXISTS "foundation";


ALTER SCHEMA "foundation" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "foundation"."is_nonblank_text_array"("value" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    SET "search_path" TO ''
    AS $$
declare
  item text;
begin
  foreach item in array value loop
    if item is null or btrim(item) = '' then
      return false;
    end if;
  end loop;

  return true;
end;
$$;


ALTER FUNCTION "foundation"."is_nonblank_text_array"("value" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "foundation"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "foundation"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "foundation"."uuid_v7"() RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  ts_ms bigint;
  uuid_bytes bytea;
BEGIN
  ts_ms := extract(epoch FROM clock_timestamp()) * 1000;
  uuid_bytes := set_byte(
    set_byte(
      overlay(
        -- 6 bytes timestamp + 10 bytes random
        substring(int8send(ts_ms) FROM 3 FOR 6) ||
        extensions.gen_random_bytes(10)
        -- set version 7
        PLACING '\x70'::bytea FROM 7 FOR 1
      ),
      -- set variant bits (10xx)
      8,
      (get_byte(extensions.gen_random_bytes(1), 0) & 63) | 128
    ),
    -- preserve version nibble
    6,
    (get_byte(substring(int8send(ts_ms) FROM 3 FOR 6) || extensions.gen_random_bytes(10), 6) & 15) | 112
  );
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;


ALTER FUNCTION "foundation"."uuid_v7"() OWNER TO "postgres";


GRANT USAGE ON SCHEMA "foundation" TO "authenticated";
GRANT USAGE ON SCHEMA "foundation" TO "service_role";



REVOKE ALL ON FUNCTION "foundation"."is_nonblank_text_array"("value" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "foundation"."is_nonblank_text_array"("value" "text"[]) TO "service_role";
GRANT ALL ON FUNCTION "foundation"."is_nonblank_text_array"("value" "text"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "foundation"."set_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "foundation"."set_updated_at"() TO "service_role";
GRANT ALL ON FUNCTION "foundation"."set_updated_at"() TO "authenticated";



REVOKE ALL ON FUNCTION "foundation"."uuid_v7"() FROM PUBLIC;
GRANT ALL ON FUNCTION "foundation"."uuid_v7"() TO "service_role";
GRANT ALL ON FUNCTION "foundation"."uuid_v7"() TO "authenticated";
