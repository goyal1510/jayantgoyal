/**
 * Portfolio Database Types
 * TypeScript interfaces for the portfolio schema tables
 */

// ============================================================================
// JSONB Field Interfaces
// ============================================================================

export interface PersonalInfo {
  label: string;
  value: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon_key: string;
  color: string;
}

export interface PortfolioPrinciple {
  title: string;
  copy: string;
}

// ============================================================================
// Row Types (what we SELECT from the database)
// ============================================================================

export interface HeroRow {
  id: string;
  name: string;
  role: string;
  tagline: string | null;
  blurb: string | null;
  location: string | null;
  headline: string | null;
  current_title: string | null;
  availability: string | null;
  resume_url: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutRow {
  id: string;
  summary: string | null;
  personal: PersonalInfo[];
  highlights: string[];
  headline: string | null;
  objective: string | null;
  story: string[];
  principles: PortfolioPrinciple[];
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface EducationRow {
  id: string;
  school: string;
  degree: string;
  period: string;
  location: string | null;
  detail: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExperienceRow {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string | null;
  summary: string | null;
  bullets: string[];
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillCategoryRow {
  id: string;
  title: string;
  icon_key: string;
  color: string | null;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillRow {
  id: string;
  category_id: string;
  name: string;
  icon_key: string;
  level: number | null;
  proficiency: "core" | "strong" | "working" | "exploring" | null;
  evidence: string | null;
  is_featured: boolean;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface TechIconRow {
  id: string;
  icon_key: string;
  name: string;
  color: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  image_light: string | null;
  image_dark: string | null;
  tags: string[];
  github_link: string | null;
  live_link: string | null;
  slug: string | null;
  eyebrow: string | null;
  impact: string | null;
  contribution: string | null;
  year_label: string | null;
  image_key: string | null;
  image_alt: string | null;
  is_featured: boolean;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateRow {
  id: string;
  name: string;
  path: string;
  description: string | null;
  category: string | null;
  issuer: string | null;
  issued_at: string | null;
  credential_id: string | null;
  credential_url: string | null;
  document_key: string | null;
  preview_key: string | null;
  image_alt: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactRow {
  id: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  socials: SocialLink[];
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface NavItemRow {
  id: string;
  section_id: string;
  label: string;
  icon_key: string;
  color: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Insert Types (what we INSERT into the database)
// ============================================================================

export interface HeroInsert {
  name: string;
  role: string;
  tagline?: string | null;
  blurb?: string | null;
  location?: string | null;
  headline?: string | null;
  current_title?: string | null;
  availability?: string | null;
  resume_url?: string | null;
  is_visible?: boolean;
}

export interface AboutInsert {
  summary?: string | null;
  personal?: PersonalInfo[];
  highlights?: string[];
  headline?: string | null;
  objective?: string | null;
  story?: string[];
  principles?: PortfolioPrinciple[];
  is_visible?: boolean;
}

export interface EducationInsert {
  school: string;
  degree: string;
  period: string;
  location?: string | null;
  detail?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

export interface ExperienceInsert {
  company: string;
  role: string;
  period: string;
  location?: string | null;
  summary?: string | null;
  bullets?: string[];
  sort_order?: number;
  is_visible?: boolean;
}

export interface SkillCategoryInsert {
  title: string;
  icon_key: string;
  color?: string | null;
  description?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

export interface SkillInsert {
  category_id: string;
  name: string;
  level?: number | null;
  proficiency?: "core" | "strong" | "working" | "exploring" | null;
  evidence?: string | null;
  is_featured?: boolean;
  sort_order?: number;
  is_visible?: boolean;
}

export interface TechIconInsert {
  icon_key: string;
  name: string;
  color?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

export interface ProjectInsert {
  name: string;
  short_description?: string | null;
  full_description?: string | null;
  image_light?: string | null;
  image_dark?: string | null;
  tags?: string[];
  github_link?: string | null;
  live_link?: string | null;
  slug?: string | null;
  eyebrow?: string | null;
  impact?: string | null;
  contribution?: string | null;
  year_label?: string | null;
  image_key?: string | null;
  image_alt?: string | null;
  is_featured?: boolean;
  sort_order?: number;
  is_visible?: boolean;
}

export interface CertificateInsert {
  name: string;
  path: string;
  description?: string | null;
  category?: string | null;
  issuer?: string | null;
  issued_at?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  document_key?: string | null;
  preview_key?: string | null;
  image_alt?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

export interface ContactInsert {
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  socials?: SocialLink[];
  is_visible?: boolean;
}

export interface NavItemInsert {
  section_id: string;
  label: string;
  icon_key: string;
  color?: string | null;
  sort_order?: number;
  is_visible?: boolean;
}

// ============================================================================
// Update Types (what we UPDATE in the database)
// ============================================================================

export type HeroUpdate = Partial<HeroInsert>;
export type AboutUpdate = Partial<AboutInsert>;
export type EducationUpdate = Partial<EducationInsert>;
export type ExperienceUpdate = Partial<ExperienceInsert>;
export type SkillCategoryUpdate = Partial<SkillCategoryInsert>;
export type SkillUpdate = Partial<SkillInsert>;
export type TechIconUpdate = Partial<TechIconInsert>;
export type ProjectUpdate = Partial<ProjectInsert>;
export type CertificateUpdate = Partial<CertificateInsert>;
export type ContactUpdate = Partial<ContactInsert>;
export type NavItemUpdate = Partial<NavItemInsert>;

// ============================================================================
// Composite Types
// ============================================================================

/**
 * Skill category with its skills attached
 */
export interface SkillCategoryWithSkills extends SkillCategoryRow {
  skills: SkillRow[];
}

/**
 * Complete portfolio data from database
 * This is the shape returned by getFullPortfolioData()
 */
export interface PortfolioDatabaseData {
  hero: HeroRow | null;
  about: AboutRow | null;
  education: EducationRow[];
  experience: ExperienceRow[];
  skillCategories: SkillCategoryWithSkills[];
  techIcons: TechIconRow[];
  projects: ProjectRow[];
  certificates: CertificateRow[];
  contact: ContactRow | null;
  navItems: NavItemRow[];
}

// ============================================================================
// Transformed Types (for component compatibility)
// ============================================================================

/**
 * Hero data transformed for component usage
 */
export interface HeroData {
  name: string;
  role: string;
  tagline: string;
  blurb: string;
  location: string;
}

/**
 * About data transformed for component usage
 */
export interface AboutData {
  summary: string;
  personal: PersonalInfo[];
  highlights: string[];
}

/**
 * Education entry transformed for component usage
 */
export interface EducationData {
  school: string;
  degree: string;
  period: string;
  location: string;
  detail: string;
}

/**
 * Experience entry transformed for component usage
 */
export interface ExperienceData {
  company: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  bullets: string[];
}

/**
 * Skill set (category with items) transformed for component usage
 */
export interface SkillSetData {
  title: string;
  icon_key: string;
  color: string;
  items: { name: string; icon_key: string; level: number }[];
}

/**
 * Tech icon transformed for component usage
 */
export interface TechIconData {
  icon_key: string;
  name: string;
  color: string;
}

/**
 * Project transformed for component usage
 */
export interface ProjectData {
  name: string;
  shortDescription: string;
  fullDescription: string;
  imageLight: string;
  imageDark: string;
  tags: string[];
  githubLink: string;
  liveLink: string;
}

/**
 * Certificate transformed for component usage
 */
export interface CertificateData {
  name: string;
  path: string;
  description: string;
  category: string;
  issuer: string;
}

/**
 * Contact data transformed for component usage
 */
export interface ContactData {
  email: string;
  phone: string;
  location: string;
  socials: SocialLink[];
}

/**
 * Nav item transformed for component usage
 */
export interface NavItemData {
  id: string;
  label: string;
  icon_key: string;
  color: string;
}

/**
 * Complete transformed portfolio data for components
 */
export interface TransformedPortfolioData {
  NAV_ITEMS: NavItemData[];
  HERO: HeroData;
  ABOUT: AboutData;
  EDUCATION: EducationData[];
  EXPERIENCE: ExperienceData[];
  SKILL_SETS: SkillSetData[];
  TECH_ICONS: TechIconData[];
  PROJECTS: ProjectData[];
  CERTIFICATES: CertificateData[];
  CONTACT: ContactData;
}
