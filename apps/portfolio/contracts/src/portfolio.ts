import type { PortfolioSectionKey } from "./sections";

export type SkillProficiency = "core" | "strong" | "working" | "exploring";

export interface PortfolioPersonalInfo {
  label: string;
  value: string;
}

export interface PortfolioPrinciple {
  title: string;
  copy: string;
}

export interface PortfolioSocialLink {
  label: string;
  href: string;
  icon_key: string;
}

export const PORTFOLIO_SOCIAL_ICON_OPTIONS = [
  { value: "Github", label: "GitHub" },
  { value: "Linkedin", label: "LinkedIn" },
  { value: "Twitter", label: "Twitter / X" },
  { value: "Instagram", label: "Instagram" },
  { value: "Facebook", label: "Facebook" },
  { value: "Youtube", label: "YouTube" },
  { value: "Globe2", label: "Website" },
] as const;

export interface PortfolioHeroRecord {
  id: string;
  name: string;
  display_name: string;
  role: string;
  tagline: string;
  blurb: string;
  headline: string;
  current_title: string;
  availability: string;
  resume_url: string;
  github_username: string;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
}

export type PortfolioHeroPublicRow = Pick<
  PortfolioHeroRecord,
  | "role"
  | "tagline"
  | "blurb"
  | "headline"
  | "current_title"
  | "availability"
  | "resume_url"
  | "github_username"
  | "seo_description"
>;

export interface PortfolioAboutRecord {
  id: string;
  summary: string;
  personal: PortfolioPersonalInfo[];
  headline: string;
  objective: string;
  story: string[];
  principles: PortfolioPrinciple[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioAboutPublicRow {
  headline: string;
  objective: string;
  summary: string;
  story: unknown;
  personal: unknown;
  principles: unknown;
}

export interface PortfolioEducationRecord {
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

export type PortfolioEducationPublicRow = Pick<
  PortfolioEducationRecord,
  "school" | "degree" | "period" | "location" | "detail"
>;

export interface PortfolioExperienceRecord {
  id: string;
  company: string;
  company_url: string | null;
  company_linkedin_url: string | null;
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

export type PortfolioExperiencePublicRow = Pick<
  PortfolioExperienceRecord,
  | "company"
  | "company_url"
  | "company_linkedin_url"
  | "role"
  | "period"
  | "location"
  | "summary"
  | "bullets"
>;

export interface PortfolioSkillCategoryRecord {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export type PortfolioSkillCategoryPublicRow = Pick<
  PortfolioSkillCategoryRecord,
  "id" | "title" | "description"
>;

export interface PortfolioSkillRecord {
  id: string;
  category_id: string;
  name: string;
  proficiency: SkillProficiency;
  evidence: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSkillPublicRow {
  category_id: string;
  name: string;
  proficiency: string;
  evidence: string;
}

export interface PortfolioCaseStudyDecision {
  title: string;
  detail: string;
}

export interface PortfolioWorkCaseStudy {
  problem: string;
  solution: string;
  architecture: string;
  decisions: PortfolioCaseStudyDecision[];
  security: string;
  tradeoffs: string;
  outcome: string;
  next_improvement: string;
}

export interface PortfolioWorkRecord {
  id: string;
  name: string;
  short_description: string;
  tags: string[];
  github_link: string | null;
  live_link: string | null;
  slug: string;
  eyebrow: string;
  impact: string;
  contribution: string;
  year_label: string;
  image_url: string;
  image_alt: string;
  case_study: PortfolioWorkCaseStudy | null;
  case_study_published: boolean;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioWorkPublicRow {
  name: string;
  slug: string;
  eyebrow: string;
  short_description: string;
  impact: string;
  contribution: string;
  year_label: string;
  image_url: string;
  image_alt: string;
  case_study: unknown;
  case_study_published: boolean;
  tags: unknown;
  github_link: string | null;
  live_link: string | null;
}

export interface PortfolioCertificateRecord {
  id: string;
  name: string;
  description: string | null;
  category: string;
  issuer: string;
  issued_at: string | null;
  credential_id: string | null;
  credential_url: string | null;
  document_url: string;
  preview_url: string;
  image_alt: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export type PortfolioCertificatePublicRow = Pick<
  PortfolioCertificateRecord,
  | "name"
  | "description"
  | "category"
  | "issuer"
  | "issued_at"
  | "credential_id"
  | "credential_url"
  | "document_url"
  | "preview_url"
  | "image_alt"
>;

export interface PortfolioContactRecord {
  id: string;
  email: string;
  phone: string;
  location: string;
  socials: PortfolioSocialLink[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioContactPublicRow {
  email: string;
  phone: string;
  location: string;
  socials: unknown;
}

export interface PortfolioNavigationRecord {
  id: string;
  section_id: PortfolioSectionKey;
  label: string;
  note: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioNavigationPublicRow {
  section_id: string;
  label: string;
  note: string | null;
}

export interface PortfolioSectionContentRecord {
  id: string;
  section_key: PortfolioSectionKey;
  eyebrow: string;
  headline: string | null;
  accent: string | null;
  description: string | null;
  supporting_text: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSectionContentPublicRow {
  section_key: string;
  eyebrow: string;
  headline: string | null;
  accent: string | null;
  description: string | null;
  supporting_text: string | null;
  is_visible: boolean;
}

export type PortfolioTable =
  | "hero"
  | "about"
  | "education"
  | "experience"
  | "skill_categories"
  | "skills"
  | "work"
  | "certificates"
  | "contact"
  | "nav_items"
  | "section_content";

export const PORTFOLIO_TABLES = [
  "hero",
  "about",
  "education",
  "experience",
  "skill_categories",
  "skills",
  "work",
  "certificates",
  "contact",
  "nav_items",
  "section_content",
] as const satisfies readonly PortfolioTable[];

export type PortfolioRecordMap = {
  hero: PortfolioHeroRecord;
  about: PortfolioAboutRecord;
  education: PortfolioEducationRecord;
  experience: PortfolioExperienceRecord;
  skill_categories: PortfolioSkillCategoryRecord;
  skills: PortfolioSkillRecord;
  work: PortfolioWorkRecord;
  certificates: PortfolioCertificateRecord;
  contact: PortfolioContactRecord;
  nav_items: PortfolioNavigationRecord;
  section_content: PortfolioSectionContentRecord;
};

export const PORTFOLIO_SELECT_COLUMNS: Record<PortfolioTable, string> = {
  hero: "role, tagline, blurb, headline, current_title, availability, resume_url, github_username, seo_description",
  about: "headline, objective, summary, story, personal, principles",
  education: "school, degree, period, location, detail",
  experience:
    "company, company_url, company_linkedin_url, role, period, location, summary, bullets",
  skill_categories: "id, title, description",
  skills: "category_id, name, proficiency, evidence",
  work: "name, slug, eyebrow, short_description, impact, contribution, year_label, image_url, image_alt, case_study, case_study_published, tags, github_link, live_link",
  certificates:
    "name, description, category, issuer, issued_at, credential_id, credential_url, document_url, preview_url, image_alt",
  contact: "email, phone, location, socials",
  nav_items: "section_id, label, note",
  section_content:
    "section_key, eyebrow, headline, accent, description, supporting_text, is_visible",
};

/** Full CMS rows for authenticated Admin editors, including generated metadata. */
export const PORTFOLIO_ADMIN_SELECT_COLUMNS: Record<PortfolioTable, string> = {
  hero: "id, name, display_name, role, tagline, blurb, headline, current_title, availability, resume_url, github_username, seo_title, seo_description, created_at, updated_at",
  about:
    "id, headline, objective, summary, story, personal, principles, created_at, updated_at",
  education:
    "id, school, degree, period, location, detail, sort_order, is_visible, created_at, updated_at",
  experience:
    "id, company, company_url, company_linkedin_url, role, period, location, summary, bullets, sort_order, is_visible, created_at, updated_at",
  skill_categories:
    "id, title, description, sort_order, is_visible, created_at, updated_at",
  skills:
    "id, category_id, name, proficiency, evidence, sort_order, is_visible, created_at, updated_at",
  work: "id, name, slug, eyebrow, short_description, impact, contribution, year_label, image_url, image_alt, case_study, case_study_published, tags, github_link, live_link, sort_order, is_visible, created_at, updated_at",
  certificates:
    "id, name, description, category, issuer, issued_at, credential_id, credential_url, document_url, preview_url, image_alt, sort_order, is_visible, created_at, updated_at",
  contact: "id, email, phone, location, socials, created_at, updated_at",
  nav_items:
    "id, section_id, label, note, sort_order, is_visible, created_at, updated_at",
  section_content:
    "id, section_key, eyebrow, headline, accent, description, supporting_text, is_visible, created_at, updated_at",
};

type WithoutGeneratedColumns<T> = Omit<T, "id" | "created_at" | "updated_at">;

type PortfolioHeroWriteInput = Omit<
  WithoutGeneratedColumns<PortfolioHeroRecord>,
  "name" | "display_name" | "seo_title"
>;

export type PortfolioWriteInputMap = {
  hero: PortfolioHeroWriteInput;
  about: WithoutGeneratedColumns<PortfolioAboutRecord>;
  education: WithoutGeneratedColumns<PortfolioEducationRecord>;
  experience: WithoutGeneratedColumns<PortfolioExperienceRecord>;
  skill_categories: WithoutGeneratedColumns<PortfolioSkillCategoryRecord>;
  skills: WithoutGeneratedColumns<PortfolioSkillRecord>;
  work: WithoutGeneratedColumns<PortfolioWorkRecord>;
  certificates: WithoutGeneratedColumns<PortfolioCertificateRecord>;
  contact: WithoutGeneratedColumns<PortfolioContactRecord>;
  nav_items: WithoutGeneratedColumns<PortfolioNavigationRecord>;
  section_content: WithoutGeneratedColumns<PortfolioSectionContentRecord>;
};

/** Payload required when an Admin editor creates a new row. */
export type PortfolioCreateInputMap = PortfolioWriteInputMap;

/** Payload accepted when an Admin editor updates an existing row. */
export type PortfolioUpdateInputMap = {
  [Table in PortfolioTable]: Partial<PortfolioWriteInputMap[Table]>;
};

export type PortfolioCreateInput<Table extends PortfolioTable> =
  PortfolioCreateInputMap[Table];

export type PortfolioUpdateInput<Table extends PortfolioTable> =
  PortfolioUpdateInputMap[Table];

/** Backwards-compatible name for update payloads used by older consumers. */
export type PortfolioWriteInput<Table extends PortfolioTable> =
  PortfolioUpdateInput<Table>;
