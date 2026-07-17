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
  role: string;
  tagline: string | null;
  blurb: string | null;
  location: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface About {
  id: string;
  summary: string | null;
  personal: PersonalInfo[];
  highlights: string[];
  is_visible: boolean;
  created_at: string;
  updated_at: string;
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
  icon_key: string;
  color: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  icon_key: string;
  level: number | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillCategoryWithSkills extends SkillCategory {
  skills: Skill[];
}

export interface TechIcon {
  id: string;
  icon_key: string;
  name: string;
  color: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  image_light: string | null;
  image_dark: string | null;
  tags: string[];
  github_link: string | null;
  live_link: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  name: string;
  path: string;
  description: string | null;
  category: string | null;
  issuer: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  socials: SocialLink[];
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon_key: string;
}

export interface NavItem {
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

export type VercelEnvTarget = "production" | "preview" | "development";

export interface VercelEnvVar {
  id: string;
  key: string;
  value: string;
  type: "system" | "encrypted" | "plain" | "secret" | "sensitive";
  target: VercelEnvTarget[];
  configurationId?: string | null;
  createdAt?: number;
  updatedAt?: number;
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
  sort_order: number;
  created_at: string;
  updated_at: string;
}
