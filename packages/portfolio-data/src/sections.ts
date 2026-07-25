export const PORTFOLIO_SECTION_KEYS = [
  "hero",
  "about",
  "skills",
  "education",
  "experience",
  "credentials",
  "activity",
  "work",
  "contact",
  "writing",
  "article",
  "resume",
  "studio",
  "case-studies",
  "engineering",
] as const;

export type PortfolioSectionKey = (typeof PORTFOLIO_SECTION_KEYS)[number];

export const PORTFOLIO_PUBLIC_NAVIGATION_KEYS = [
  "about",
  "studio",
  "work",
  "case-studies",
  "engineering",
  "activity",
  "writing",
  "resume",
  "contact",
] as const;

export type PortfolioNavigationKey =
  (typeof PORTFOLIO_PUBLIC_NAVIGATION_KEYS)[number];

export const PORTFOLIO_PUBLIC_SECTION_ORDER = [
  "about",
  "skills",
  "experience",
  "activity",
  "work",
  "writing",
  "contact",
] as const satisfies readonly PortfolioSectionKey[];

export type PortfolioWorkspaceKey =
  | "home"
  | "about"
  | "skills"
  | "experience"
  | "activity"
  | "work"
  | "writing"
  | "contact";

export const PORTFOLIO_SECTION_WORKSPACES: Record<
  PortfolioSectionKey,
  PortfolioWorkspaceKey
> = {
  hero: "home",
  about: "about",
  skills: "skills",
  education: "about",
  experience: "experience",
  credentials: "experience",
  activity: "activity",
  work: "work",
  contact: "contact",
  writing: "writing",
  article: "writing",
  resume: "home",
  studio: "work",
  "case-studies": "work",
  engineering: "skills",
};

export const PORTFOLIO_WORKSPACE_ROUTES: Record<PortfolioWorkspaceKey, string> =
  {
    home: "/portfolio/home",
    about: "/portfolio/about",
    skills: "/portfolio/skills",
    experience: "/portfolio/experience",
    activity: "/portfolio/activity",
    work: "/portfolio/work",
    writing: "/portfolio/writing",
    contact: "/portfolio/contact",
  };
