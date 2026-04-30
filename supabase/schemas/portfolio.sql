


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


CREATE SCHEMA IF NOT EXISTS "portfolio";


ALTER SCHEMA "portfolio" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "portfolio"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "portfolio"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "portfolio"."about" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "summary" "text",
    "personal" "jsonb" DEFAULT '[]'::"jsonb",
    "highlights" "jsonb" DEFAULT '[]'::"jsonb",
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."about" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "path" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "issuer" "text",
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."contact" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "phone" "text",
    "location" "text",
    "socials" "jsonb" DEFAULT '[]'::"jsonb",
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."contact" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."education" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "school" "text" NOT NULL,
    "degree" "text" NOT NULL,
    "period" "text" NOT NULL,
    "location" "text",
    "detail" "text",
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."experience" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company" "text" NOT NULL,
    "role" "text" NOT NULL,
    "period" "text" NOT NULL,
    "location" "text",
    "summary" "text",
    "bullets" "jsonb" DEFAULT '[]'::"jsonb",
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."experience" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."hero" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "tagline" "text",
    "blurb" "text",
    "location" "text",
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."hero" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."nav_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "icon_key" "text" NOT NULL,
    "color" "text",
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."nav_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "short_description" "text",
    "full_description" "text",
    "image_light" "text",
    "image_dark" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "github_link" "text",
    "live_link" "text",
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."skill_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "icon_key" "text" NOT NULL,
    "color" "text",
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."skill_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "level" integer,
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "skills_level_check" CHECK ((("level" >= 0) AND ("level" <= 100)))
);


ALTER TABLE "portfolio"."skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."tech_icons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "icon_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "sort_order" integer DEFAULT 0,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "portfolio"."tech_icons" OWNER TO "postgres";


ALTER TABLE ONLY "portfolio"."about"
    ADD CONSTRAINT "about_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."contact"
    ADD CONSTRAINT "contact_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."education"
    ADD CONSTRAINT "education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."experience"
    ADD CONSTRAINT "experience_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."hero"
    ADD CONSTRAINT "hero_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."nav_items"
    ADD CONSTRAINT "nav_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."skill_categories"
    ADD CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."skills"
    ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."tech_icons"
    ADD CONSTRAINT "tech_icons_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_certificates_sort_order" ON "portfolio"."certificates" USING "btree" ("sort_order");



CREATE INDEX "idx_education_sort_order" ON "portfolio"."education" USING "btree" ("sort_order");



CREATE INDEX "idx_experience_sort_order" ON "portfolio"."experience" USING "btree" ("sort_order");



CREATE INDEX "idx_nav_items_sort_order" ON "portfolio"."nav_items" USING "btree" ("sort_order");



CREATE INDEX "idx_projects_sort_order" ON "portfolio"."projects" USING "btree" ("sort_order");



CREATE INDEX "idx_skill_categories_sort_order" ON "portfolio"."skill_categories" USING "btree" ("sort_order");



CREATE INDEX "idx_skills_category_id" ON "portfolio"."skills" USING "btree" ("category_id");



CREATE INDEX "idx_skills_sort_order" ON "portfolio"."skills" USING "btree" ("sort_order");



CREATE INDEX "idx_tech_icons_sort_order" ON "portfolio"."tech_icons" USING "btree" ("sort_order");



CREATE OR REPLACE TRIGGER "about_updated_at" BEFORE UPDATE ON "portfolio"."about" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "certificates_updated_at" BEFORE UPDATE ON "portfolio"."certificates" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "contact_updated_at" BEFORE UPDATE ON "portfolio"."contact" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "education_updated_at" BEFORE UPDATE ON "portfolio"."education" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "experience_updated_at" BEFORE UPDATE ON "portfolio"."experience" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "hero_updated_at" BEFORE UPDATE ON "portfolio"."hero" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "nav_items_updated_at" BEFORE UPDATE ON "portfolio"."nav_items" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "projects_updated_at" BEFORE UPDATE ON "portfolio"."projects" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "skill_categories_updated_at" BEFORE UPDATE ON "portfolio"."skill_categories" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "skills_updated_at" BEFORE UPDATE ON "portfolio"."skills" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "tech_icons_updated_at" BEFORE UPDATE ON "portfolio"."tech_icons" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



ALTER TABLE ONLY "portfolio"."skills"
    ADD CONSTRAINT "skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "portfolio"."skill_categories"("id") ON DELETE CASCADE;



CREATE POLICY "Admin write access" ON "portfolio"."about" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."certificates" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."contact" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."education" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."experience" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."hero" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."nav_items" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."projects" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."skill_categories" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."skills" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."tech_icons" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Public read access" ON "portfolio"."about" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."certificates" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."contact" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."education" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."experience" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."hero" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."nav_items" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."projects" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."skill_categories" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."skills" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."tech_icons" FOR SELECT USING (("is_visible" = true));



ALTER TABLE "portfolio"."about" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."contact" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."education" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."experience" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."hero" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."nav_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."skill_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."tech_icons" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "portfolio" TO "anon";
GRANT USAGE ON SCHEMA "portfolio" TO "authenticated";
GRANT USAGE ON SCHEMA "portfolio" TO "service_role";



GRANT ALL ON FUNCTION "portfolio"."update_updated_at_column"() TO "service_role";
GRANT ALL ON FUNCTION "portfolio"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "portfolio"."update_updated_at_column"() TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."about" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."about" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."about" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."certificates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."certificates" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."certificates" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."contact" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."contact" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."contact" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."education" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."education" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."education" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."experience" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."experience" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."experience" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."hero" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."hero" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."hero" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."nav_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."nav_items" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."nav_items" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."projects" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."projects" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."projects" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."skill_categories" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."skill_categories" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."skill_categories" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."skills" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."skills" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."skills" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."tech_icons" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."tech_icons" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."tech_icons" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "portfolio" GRANT SELECT,USAGE ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "portfolio" GRANT SELECT ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "portfolio" GRANT SELECT ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "portfolio" GRANT ALL ON TABLES TO "service_role";




