import type { PortfolioNavigationItem } from "./editorial-data";

export type PortfolioNavigationSurface = "home" | "subpage";

const ANALYTICS_NAVIGATION_ITEM: PortfolioNavigationItem = {
  key: "analytics",
  label: "Analytics",
  note: "Live site traffic",
};

const PORTFOLIO_DESTINATIONS: Record<string, string> = {
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

/** Adds the product-owned Analytics destination without duplicating CMS entries. */
export function includeAnalyticsNavigation(
  items: PortfolioNavigationItem[],
): PortfolioNavigationItem[] {
  return items.some((item) => item.key === ANALYTICS_NAVIGATION_ITEM.key)
    ? items
    : [...items, ANALYTICS_NAVIGATION_ITEM];
}
