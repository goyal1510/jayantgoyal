/**
 * The canonical Auth application surface.
 *
 * This is deliberately React- and framework-free so each application can
 * reason about the same ownership contract without importing Auth UI or
 * Next.js route modules. The Auth app owns these paths; product applications
 * may link to them through the entry helpers, but must not reimplement them.
 */

export const AUTH_SURFACE_ROUTES = [
  { id: "welcome", pathname: "/welcome", area: "entry" },
  { id: "register", pathname: "/register", area: "entry" },
  { id: "forgot-password", pathname: "/forgot-password", area: "recovery" },
  { id: "reset-password", pathname: "/reset-password", area: "recovery" },
  { id: "verify", pathname: "/verify", area: "recovery" },
  { id: "callback", pathname: "/callback", area: "callback" },
  { id: "mfa", pathname: "/mfa", area: "security" },
  { id: "account-security", pathname: "/account/security", area: "account" },
  { id: "account-providers", pathname: "/account/providers", area: "account" },
  { id: "logout", pathname: "/logout", area: "account" },
] as const;

export type AuthSurfaceRoute = (typeof AUTH_SURFACE_ROUTES)[number];
export type AuthSurfaceRouteId = AuthSurfaceRoute["id"];
export type AuthSurfaceArea = AuthSurfaceRoute["area"];

export function authSurfacePath(id: AuthSurfaceRouteId): string {
  return authSurfaceRoute(id).pathname;
}

export function authSurfaceRoute(id: AuthSurfaceRouteId): AuthSurfaceRoute {
  const route = AUTH_SURFACE_ROUTES.find((candidate) => candidate.id === id);
  if (!route) throw new Error(`Unknown Auth surface route: ${id}`);
  return route;
}
