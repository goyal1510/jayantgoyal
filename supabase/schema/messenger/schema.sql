


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


CREATE SCHEMA IF NOT EXISTS "messenger";


ALTER SCHEMA "messenger" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "messenger"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "messenger"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "messenger"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "message_type" "text" NOT NULL,
    "language" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_read" boolean DEFAULT false,
    CONSTRAINT "messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'code'::"text"])))
);


ALTER TABLE "messenger"."messages" OWNER TO "postgres";


ALTER TABLE ONLY "messenger"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_messages_created_at" ON "messenger"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_user_id" ON "messenger"."messages" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_messages_updated_at" BEFORE UPDATE ON "messenger"."messages" FOR EACH ROW EXECUTE FUNCTION "messenger"."update_updated_at_column"();



ALTER TABLE ONLY "messenger"."messages"
    ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete their own messages" ON "messenger"."messages" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own messages" ON "messenger"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own messages" ON "messenger"."messages" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own messages" ON "messenger"."messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "messenger"."messages" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "messenger" TO "authenticated";
GRANT USAGE ON SCHEMA "messenger" TO "anon";



GRANT ALL ON FUNCTION "messenger"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "messenger"."update_updated_at_column"() TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "messenger"."messages" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "messenger"."messages" TO "anon";




