


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


CREATE SCHEMA IF NOT EXISTS "activity_tracker";


ALTER SCHEMA "activity_tracker" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "activity_tracker"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "activity_tracker"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "activity_tracker"."activity_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid",
    "date" "date" NOT NULL,
    "completed" boolean DEFAULT false,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "activity_tracker"."activity_entries" OWNER TO "postgres";


ALTER TABLE ONLY "activity_tracker"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "activity_tracker"."activity_entries"
    ADD CONSTRAINT "activity_entries_activity_id_date_user_id_key" UNIQUE ("activity_id", "date", "user_id");



ALTER TABLE ONLY "activity_tracker"."activity_entries"
    ADD CONSTRAINT "activity_entries_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activities_user_id" ON "activity_tracker"."activities" USING "btree" ("user_id");



CREATE INDEX "idx_activity_entries_activity_id" ON "activity_tracker"."activity_entries" USING "btree" ("activity_id");



CREATE INDEX "idx_activity_entries_date" ON "activity_tracker"."activity_entries" USING "btree" ("date");



CREATE INDEX "idx_activity_entries_user_activity_date" ON "activity_tracker"."activity_entries" USING "btree" ("user_id", "activity_id", "date");



CREATE INDEX "idx_activity_entries_user_id" ON "activity_tracker"."activity_entries" USING "btree" ("user_id");



ALTER TABLE ONLY "activity_tracker"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "activity_tracker"."activity_entries"
    ADD CONSTRAINT "activity_entries_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activity_tracker"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "activity_tracker"."activity_entries"
    ADD CONSTRAINT "activity_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete their own activities" ON "activity_tracker"."activities" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own entries" ON "activity_tracker"."activity_entries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own activities" ON "activity_tracker"."activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own entries" ON "activity_tracker"."activity_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own activities" ON "activity_tracker"."activities" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own entries" ON "activity_tracker"."activity_entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own activities" ON "activity_tracker"."activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own entries" ON "activity_tracker"."activity_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "activity_tracker"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "activity_tracker"."activity_entries" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "activity_tracker" TO "authenticated";
GRANT USAGE ON SCHEMA "activity_tracker" TO "anon";
GRANT USAGE ON SCHEMA "activity_tracker" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "activity_tracker"."activities" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "activity_tracker"."activities" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "activity_tracker"."activities" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "activity_tracker"."activity_entries" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "activity_tracker"."activity_entries" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "activity_tracker"."activity_entries" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "activity_tracker" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "activity_tracker" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";




