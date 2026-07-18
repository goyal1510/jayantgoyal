/**
 * Admin Types
 */

export type UserRole = "user" | "admin" | "super_admin";

export interface Profile {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: UserRole;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
  email?: string; // Joined from auth.users
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ProfileWithUser extends Profile {
  user?: User;
}

/**
 * Auth context type
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Portfolio Types
 */

export interface Hero {
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

export interface About {
  id: string;
  summary: string;
  personal: PersonalInfo[];
  headline: string;
  objective: string;
  story: string[];
  principles: PortfolioPrinciple[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioPrinciple {
  title: string;
  copy: string;
}

export interface PersonalInfo {
  label: string;
  value: string;
}

export interface Education {
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

export interface Experience {
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

export interface SkillCategory {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  proficiency: "core" | "strong" | "working" | "exploring";
  evidence: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillCategoryWithSkills extends SkillCategory {
  skills: Skill[];
}

export interface Project {
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
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
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

export interface Contact {
  id: string;
  email: string;
  phone: string;
  location: string;
  socials: SocialLink[];
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon_key: string;
}

export interface NavItem {
  id: string;
  section_id: string;
  label: string;
  note: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionContent {
  id: string;
  section_key: string;
  eyebrow: string;
  headline: string | null;
  accent: string | null;
  description: string | null;
  supporting_text: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Vercel Types
 */

export type VercelDeploymentState =
  | "BUILDING"
  | "ERROR"
  | "INITIALIZING"
  | "QUEUED"
  | "READY"
  | "CANCELED";

export type VercelTarget = "production" | "preview" | null;

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: VercelDeploymentState;
  target: VercelTarget;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitRef?: string;
    githubCommitAuthorName?: string;
  };
  creator?: {
    uid: string;
    username: string;
  };
  inspectorUrl?: string;
  ready?: number;
  buildingAt?: number;
}

export interface VercelDeploymentDetail extends VercelDeployment {
  readyState: VercelDeploymentState;
  aliasAssigned?: number;
  aliasError?: { code: string; message: string } | null;
  regions: string[];
  routes?: unknown[];
  plan: string;
  projectId: string;
}

export interface VercelBuildLogEntry {
  type: "stdout" | "stderr" | "command" | "delimiter";
  created: number;
  payload: string;
}

export type VercelProjectKey = "studio" | "admin";

/**
 * Blog Types
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  tags: string[];
  is_visible: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
