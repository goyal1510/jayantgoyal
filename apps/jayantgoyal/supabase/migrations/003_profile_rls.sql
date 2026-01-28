-- Profile Table RLS Policies
-- Only super_admin can modify admin roles

-- Enable RLS on profile table
ALTER TABLE portfolio.profile ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (needed for checking roles)
CREATE POLICY "Public read access" ON portfolio.profile
  FOR SELECT
  USING (true);

-- Only super_admin can insert new profiles
CREATE POLICY "Super admin can insert profiles" ON portfolio.profile
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio.profile p
      WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Only super_admin can update profiles
CREATE POLICY "Super admin can update profiles" ON portfolio.profile
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM portfolio.profile p
      WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolio.profile p
      WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Only super_admin can delete profiles
CREATE POLICY "Super admin can delete profiles" ON portfolio.profile
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM portfolio.profile p
      WHERE p.user_id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

-- Grant necessary permissions
GRANT SELECT ON portfolio.profile TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON portfolio.profile TO authenticated;

-- Admin and super_admin can modify portfolio content
-- These policies allow admin/super_admin to edit portfolio tables

-- Function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION portfolio.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM portfolio.profile
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing portfolio table policies to allow admin write access
-- Hero table
CREATE POLICY "Admin write access" ON portfolio.hero
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- About table
CREATE POLICY "Admin write access" ON portfolio.about
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Education table
CREATE POLICY "Admin write access" ON portfolio.education
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Experience table
CREATE POLICY "Admin write access" ON portfolio.experience
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Skill categories table
CREATE POLICY "Admin write access" ON portfolio.skill_categories
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Skills table
CREATE POLICY "Admin write access" ON portfolio.skills
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Tech icons table
CREATE POLICY "Admin write access" ON portfolio.tech_icons
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Projects table
CREATE POLICY "Admin write access" ON portfolio.projects
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Certificates table
CREATE POLICY "Admin write access" ON portfolio.certificates
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Contact table
CREATE POLICY "Admin write access" ON portfolio.contact
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Nav items table
CREATE POLICY "Admin write access" ON portfolio.nav_items
  FOR ALL
  USING (portfolio.is_admin())
  WITH CHECK (portfolio.is_admin());

-- Grant write permissions to authenticated users (RLS will filter)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA portfolio TO authenticated;
