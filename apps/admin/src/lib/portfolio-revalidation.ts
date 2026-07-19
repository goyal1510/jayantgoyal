export const PORTFOLIO_PUBLIC_REVALIDATION_PATHS = [
  "/",
  "/blog",
  "/resume",
] as const;

/**
 * Return the public paths affected by an Admin CMS write.
 *
 * The public home and resume pages consume Portfolio records directly, while
 * Blog list/detail pages share the blog data source. Keeping this map in one
 * small, dependency-free module makes the invalidation boundary testable and
 * prevents each route handler from inventing a different refresh scope.
 */
export function getPortfolioPublicRevalidationPaths(): readonly string[] {
  return PORTFOLIO_PUBLIC_REVALIDATION_PATHS;
}
