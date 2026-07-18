export type ProjectTone = "paper" | "ink" | "signal";

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

export type PortfolioEducation = {
  period: string;
  school: string;
  degree: string;
  location: string;
  detail: string;
};

export type PortfolioExperience = {
  period: string;
  company: string;
  role: string;
  location: string;
  summary: string;
  outcomes: string[];
};

export type SkillProficiency = "core" | "strong" | "working" | "exploring";

export type PortfolioSkill = {
  name: string;
  proficiency: SkillProficiency;
  evidence: string;
};

export type PortfolioSkillGroup = {
  title: string;
  description: string;
  items: PortfolioSkill[];
};

export type PortfolioProject = {
  id: string;
  title: string;
  eyebrow: string;
  summary: string;
  impact: string;
  role: string;
  year: string;
  image: string;
  imageAlt: string;
  href: string | null;
  github: string | null;
  tags: string[];
  tone: ProjectTone;
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

export type PortfolioPrinciple = {
  title: string;
  copy: string;
};

export type PortfolioNavigationItem = {
  key: string;
  label: string;
  note: string;
};

export const PORTFOLIO_SECTION_KEYS = [
  "hero",
  "about",
  "skills",
  "education",
  "experience",
  "credentials",
  "activity",
  "work",
  "writing",
  "contact",
  "blog",
  "article",
  "resume",
] as const;

export type PortfolioSectionKey = (typeof PORTFOLIO_SECTION_KEYS)[number];

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

export type BlogPreview = {
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
  projects: PortfolioProject[];
  credentials: PortfolioCredential[];
  principles: PortfolioPrinciple[];
};
