import type { PortfolioNavigationItem } from "./editorial-data";

export type PortfolioNavigationSurface = "home" | "subpage";

const HOME_NAVIGATION_ITEM: PortfolioNavigationItem = {
  key: "home",
  label: "Home",
  note: "Portfolio overview",
};

const ANALYTICS_NAVIGATION_ITEM: PortfolioNavigationItem = {
  key: "analytics",
  label: "Analytics",
  note: "Live site traffic",
};

const PORTFOLIO_DESTINATIONS: Record<string, string> = {
  home: "/",
  about: "/about",
  work: "/work",
  writing: "/writing",
  resume: "/resume",
  analytics: "/analytics",
  contact: "/contact",
};

const LEGACY_PORTFOLIO_DESTINATIONS: Record<string, string> = {
  projects: "/work",
  blog: "/writing",
  activity: "/#activity",
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

/** Adds product-owned destinations without duplicating CMS-managed entries. */
export function includePortfolioNavigation(
  items: PortfolioNavigationItem[],
): PortfolioNavigationItem[] {
  const withHome = items.some((item) => item.key === HOME_NAVIGATION_ITEM.key)
    ? items
    : [HOME_NAVIGATION_ITEM, ...items];

  return withHome.some((item) => item.key === ANALYTICS_NAVIGATION_ITEM.key)
    ? withHome
    : [...withHome, ANALYTICS_NAVIGATION_ITEM];
}
