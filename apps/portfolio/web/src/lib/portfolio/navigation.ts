export type PortfolioNavigationSurface = "home" | "subpage";

const PORTFOLIO_DESTINATIONS: Record<string, string> = {
  home: "/",
  hero: "/",
  about: "/about",
  work: "/work",
  writing: "/writing",
  resume: "/resume",
  analytics: "/analytics",
  github_activity: "/#github-activity",
  contact: "/contact",
};

const LEGACY_PORTFOLIO_DESTINATIONS: Record<string, string> = {
  projects: "/work",
  blog: "/writing",
};

export function getPortfolioNavigationHref(
  key: string,
  surface: PortfolioNavigationSurface,
): string {
  const destination =
    PORTFOLIO_DESTINATIONS[key] ?? LEGACY_PORTFOLIO_DESTINATIONS[key];
  return destination ?? (surface === "home" ? `#${key}` : `/#${key}`);
}

export function isPortfolioNavigationItemCurrent(
  key: string,
  pathname: string,
): boolean {
  const destination =
    PORTFOLIO_DESTINATIONS[key] ?? LEGACY_PORTFOLIO_DESTINATIONS[key];
  return destination
    ? pathname === destination || pathname.startsWith(`${destination}/`)
    : false;
}
