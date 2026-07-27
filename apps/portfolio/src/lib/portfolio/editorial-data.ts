export type WorkTone = "paper" | "ink" | "signal";

export type PortfolioSocialLink = {
  label: string;
  href: string;
  iconKey: string;
};

export type PortfolioProfile = {
  name: string;
  displayName: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  headline: string;
  introduction: string;
  focus: string;
  currentRole: string;
  availability: string;
  githubUsername: string;
  github: string;
  socials: PortfolioSocialLink[];
  resume: string;
  seoTitle: string;
  seoDescription: string;
};

export type PortfolioAbout = {
  headline: string;
  objective: string;
  lead: string;
  story: string[];
  facts: Array<{ label: string; value: string }>;
};

type PortfolioEducation = {
  period: string;
  school: string;
  degree: string;
  location: string;
  detail: string;
};

type PortfolioExperience = {
  period: string;
  company: string;
  companyUrl: string | null;
  companyLinkedInUrl: string | null;
  role: string;
  location: string;
  summary: string;
  outcomes: string[];
};

export type SkillProficiency = "core" | "strong" | "working" | "exploring";

type PortfolioSkill = {
  name: string;
  proficiency: SkillProficiency;
  evidence: string;
};

type PortfolioSkillGroup = {
  title: string;
  description: string;
  items: PortfolioSkill[];
};

export type PortfolioWork = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  impact: string;
  role: string;
  year: string;
  image: string;
  images: string[];
  imageAlt: string;
  href: string | null;
  github: string | null;
  tags: string[];
  tone: WorkTone;
  caseStudy: {
    problem: string;
    solution: string;
    architecture: string;
    decisions: Array<{ title: string; detail: string }>;
    security: string;
    tradeoffs: string;
    outcome: string;
    nextImprovement: string;
  } | null;
};

export type PortfolioCredential = {
  name: string;
  issuer: string;
  category: string;
  description: string | null;
  issuedAt: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  href: string;
  image: string;
  imageAlt: string;
};

type PortfolioPrinciple = {
  title: string;
  copy: string;
};

export type PortfolioNavigationItem = {
  key: string;
  label: string;
  note: string;
};

export type PortfolioSectionContent = {
  eyebrow: string;
  headline: string;
  accent: string;
  description: string;
  supportingText: string;
  isVisible: boolean;
};

export type PortfolioSectionContentMap = Record<
  PortfolioSectionKey,
  PortfolioSectionContent
>;

export type WritingPreview = {
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  tags: string[];
};

export type PortfolioEditorialData = {
  profile: PortfolioProfile;
  about: PortfolioAbout;
  navigation: PortfolioNavigationItem[];
  sectionContent: PortfolioSectionContentMap;
  education: PortfolioEducation[];
  experience: PortfolioExperience[];
  skillGroups: PortfolioSkillGroup[];
  work: PortfolioWork[];
  credentials: PortfolioCredential[];
  principles: PortfolioPrinciple[];
};
import type { PortfolioSectionKey } from "@repo/portfolio-data";

export type { PortfolioSectionKey };
