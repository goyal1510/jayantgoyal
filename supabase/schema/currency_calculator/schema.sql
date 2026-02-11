


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


CREATE SCHEMA IF NOT EXISTS "currency_calculator";


ALTER SCHEMA "currency_calculator" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "currency_calculator"."calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "note" "text",
    "ist_timestamp" "text",
    "user_id" "uuid"
);


ALTER TABLE "currency_calculator"."calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "currency_calculator"."denominations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calculation_id" "uuid",
    "denomination" integer NOT NULL,
    "count" integer NOT NULL,
    "total" integer,
    "bundle_count" bigint,
    "open_count" bigint
);


ALTER TABLE "currency_calculator"."denominations" OWNER TO "postgres";


ALTER TABLE ONLY "currency_calculator"."calculations"
    ADD CONSTRAINT "calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "currency_calculator"."denominations"
    ADD CONSTRAINT "denominations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "currency_calculator"."calculations"
    ADD CONSTRAINT "calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "currency_calculator"."denominations"
    ADD CONSTRAINT "denominations_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "currency_calculator"."calculations"("id") ON DELETE CASCADE;



ALTER TABLE "currency_calculator"."calculations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own_calculations" ON "currency_calculator"."calculations" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "delete_own_denominations" ON "currency_calculator"."denominations" FOR DELETE TO "authenticated" USING (("calculation_id" IN ( SELECT "calculations"."id"
   FROM "currency_calculator"."calculations"
  WHERE ("calculations"."user_id" = "auth"."uid"()))));



ALTER TABLE "currency_calculator"."denominations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_own_calculations" ON "currency_calculator"."calculations" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_own_denominations" ON "currency_calculator"."denominations" FOR INSERT TO "authenticated" WITH CHECK (("calculation_id" IN ( SELECT "calculations"."id"
   FROM "currency_calculator"."calculations"
  WHERE ("calculations"."user_id" = "auth"."uid"()))));



CREATE POLICY "select_own_calculations" ON "currency_calculator"."calculations" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "select_own_denominations" ON "currency_calculator"."denominations" FOR SELECT TO "authenticated" USING (("calculation_id" IN ( SELECT "calculations"."id"
   FROM "currency_calculator"."calculations"
  WHERE ("calculations"."user_id" = "auth"."uid"()))));



CREATE POLICY "update_own_calculations" ON "currency_calculator"."calculations" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "update_own_denominations" ON "currency_calculator"."denominations" FOR UPDATE TO "authenticated" USING (("calculation_id" IN ( SELECT "calculations"."id"
   FROM "currency_calculator"."calculations"
  WHERE ("calculations"."user_id" = "auth"."uid"())))) WITH CHECK (("calculation_id" IN ( SELECT "calculations"."id"
   FROM "currency_calculator"."calculations"
  WHERE ("calculations"."user_id" = "auth"."uid"()))));



GRANT USAGE ON SCHEMA "currency_calculator" TO "authenticated";
GRANT USAGE ON SCHEMA "currency_calculator" TO "anon";
GRANT USAGE ON SCHEMA "currency_calculator" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "currency_calculator"."calculations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "currency_calculator"."calculations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "currency_calculator"."calculations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "currency_calculator"."denominations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "currency_calculator"."denominations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "currency_calculator"."denominations" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "currency_calculator" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "currency_calculator" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";




