-- Portfolio Schema Migration
-- Creates the portfolio schema with all tables for single-profile portfolio data

-- ============================================================================
-- SCHEMA
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS portfolio;

-- ============================================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION portfolio.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: hero
-- Landing section with name, role, tagline, blurb, location
-- ============================================================================
CREATE TABLE portfolio.hero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  tagline TEXT,
  blurb TEXT,
  location TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER hero_updated_at
  BEFORE UPDATE ON portfolio.hero
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: about
-- About section with summary, personal info (JSONB), highlights (JSONB)
-- ============================================================================
CREATE TABLE portfolio.about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary TEXT,
  personal JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER about_updated_at
  BEFORE UPDATE ON portfolio.about
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: education
-- Education entries with school, degree, period, location, detail
-- ============================================================================
CREATE TABLE portfolio.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school TEXT NOT NULL,
  degree TEXT NOT NULL,
  period TEXT NOT NULL,
  location TEXT,
  detail TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_education_sort_order ON portfolio.education(sort_order);

CREATE TRIGGER education_updated_at
  BEFORE UPDATE ON portfolio.education
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: experience
-- Work experience with company, role, period, summary, bullets (JSONB)
-- ============================================================================
CREATE TABLE portfolio.experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  period TEXT NOT NULL,
  location TEXT,
  summary TEXT,
  bullets JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_experience_sort_order ON portfolio.experience(sort_order);

CREATE TRIGGER experience_updated_at
  BEFORE UPDATE ON portfolio.experience
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: skill_categories
-- Skill group categories with title, icon_key, color
-- ============================================================================
CREATE TABLE portfolio.skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skill_categories_sort_order ON portfolio.skill_categories(sort_order);

CREATE TRIGGER skill_categories_updated_at
  BEFORE UPDATE ON portfolio.skill_categories
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: skills
-- Individual skills linked to categories via FK
-- ============================================================================
CREATE TABLE portfolio.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES portfolio.skill_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER CHECK (level >= 0 AND level <= 100),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_category_id ON portfolio.skills(category_id);
CREATE INDEX idx_skills_sort_order ON portfolio.skills(sort_order);

CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON portfolio.skills
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: tech_icons
-- Technology icons for carousel display
-- ============================================================================
CREATE TABLE portfolio.tech_icons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_key TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tech_icons_sort_order ON portfolio.tech_icons(sort_order);

CREATE TRIGGER tech_icons_updated_at
  BEFORE UPDATE ON portfolio.tech_icons
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: projects
-- Portfolio projects with descriptions, images, tags (JSONB), links
-- ============================================================================
CREATE TABLE portfolio.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  image_light TEXT,
  image_dark TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  github_link TEXT,
  live_link TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_sort_order ON portfolio.projects(sort_order);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON portfolio.projects
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: certificates
-- Certifications with name, path, description, category, issuer
-- ============================================================================
CREATE TABLE portfolio.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  category TEXT,
  issuer TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificates_sort_order ON portfolio.certificates(sort_order);

CREATE TRIGGER certificates_updated_at
  BEFORE UPDATE ON portfolio.certificates
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: contact
-- Contact information with email, phone, location, socials (JSONB)
-- ============================================================================
CREATE TABLE portfolio.contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  location TEXT,
  socials JSONB DEFAULT '[]'::jsonb,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER contact_updated_at
  BEFORE UPDATE ON portfolio.contact
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- TABLE: nav_items
-- Navigation menu items with section_id, label, icon_key, color
-- ============================================================================
CREATE TABLE portfolio.nav_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT NOT NULL,
  label TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nav_items_sort_order ON portfolio.nav_items(sort_order);

CREATE TRIGGER nav_items_updated_at
  BEFORE UPDATE ON portfolio.nav_items
  FOR EACH ROW
  EXECUTE FUNCTION portfolio.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS and create policies for public read access
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE portfolio.hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.about ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.tech_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.nav_items ENABLE ROW LEVEL SECURITY;

-- Create public read policies for all tables (anyone can read visible rows)
CREATE POLICY "Public read access" ON portfolio.hero
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.about
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.education
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.experience
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.skill_categories
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.skills
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.tech_icons
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.projects
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.certificates
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.contact
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Public read access" ON portfolio.nav_items
  FOR SELECT USING (is_visible = true);

-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA portfolio TO anon, authenticated;

-- Grant select on all tables to anon and authenticated roles
GRANT SELECT ON ALL TABLES IN SCHEMA portfolio TO anon, authenticated;

-- Grant select on future tables to anon and authenticated roles
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio GRANT SELECT ON TABLES TO anon, authenticated;
