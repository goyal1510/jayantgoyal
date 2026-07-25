/**
 * Admin Types
 */

import type {
  PortfolioAboutRecord,
  PortfolioWritingPostRecord,
  PortfolioCertificateRecord,
  PortfolioContactRecord,
  PortfolioEducationRecord,
  PortfolioExperienceRecord,
  PortfolioHeroRecord,
  PortfolioNavigationRecord,
  PortfolioPersonalInfo,
  PortfolioPrinciple as PortfolioPrincipleRecord,
  PortfolioWorkRecord,
  PortfolioSectionContentRecord,
  PortfolioSkillCategoryRecord,
  PortfolioSkillRecord,
  PortfolioSocialLink,
} from "@repo/portfolio-data";

export type UserRole = "user" | "admin" | "super_admin";

export interface Profile {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  avatar_mode: "provider" | "upload" | "initials";
  avatar_provider: string | null;
  avatar_storage_path: string | null;
  avatar_updated_at: string | null;
  role: UserRole;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
  email?: string; // Joined from auth.users
}

/**
 * Auth context type
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
}

/**
 * Portfolio Types
 */

export type Hero = PortfolioHeroRecord;
export type About = PortfolioAboutRecord;
export type PortfolioPrinciple = PortfolioPrincipleRecord;
export type PersonalInfo = PortfolioPersonalInfo;
export type Education = PortfolioEducationRecord;
export type Experience = PortfolioExperienceRecord;
export type SkillCategory = PortfolioSkillCategoryRecord;
export type Skill = PortfolioSkillRecord;

export interface SkillCategoryWithSkills extends SkillCategory {
  skills: Skill[];
}

export type WorkItem = PortfolioWorkRecord;
export type Certificate = PortfolioCertificateRecord;
export type Contact = PortfolioContactRecord;
export type SocialLink = PortfolioSocialLink;
export type NavItem = PortfolioNavigationRecord;
export type SectionContent = PortfolioSectionContentRecord;

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

type VercelTarget = "production" | "preview" | null;

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
 * Writing Types
 */

export type WritingPost = PortfolioWritingPostRecord;
