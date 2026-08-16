import { PORTFOLIO_WORKSPACE_ROUTES } from "@jayant/portfolio-contracts";

/**
 * Compatibility destinations for URLs that existed before Portfolio editing
 * became section-owned. Keeping this map in one place prevents a bookmark
 * redirect and the Admin shell's active-route logic from drifting apart.
 */
export const PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS = {
  "/portfolio/hero": PORTFOLIO_WORKSPACE_ROUTES.home,
  "/portfolio/projects": PORTFOLIO_WORKSPACE_ROUTES.work,
  "/portfolio/github": PORTFOLIO_WORKSPACE_ROUTES.activity,
  "/portfolio/education": PORTFOLIO_WORKSPACE_ROUTES.about,
  "/portfolio/certificates": PORTFOLIO_WORKSPACE_ROUTES.experience,
  "/portfolio/blog": PORTFOLIO_WORKSPACE_ROUTES.writing,
  "/blog": PORTFOLIO_WORKSPACE_ROUTES.writing,
  "/writing": PORTFOLIO_WORKSPACE_ROUTES.writing,
  "/portfolio/section-copy": "/portfolio",
  "/portfolio/navigation": "/portfolio",
} as const;

type LegacyPortfolioAdminRoute =
  keyof typeof PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS;

export function getCanonicalAdminPath(pathname: string): string {
  return (
    PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS[
      pathname as LegacyPortfolioAdminRoute
    ] ?? pathname
  );
}
