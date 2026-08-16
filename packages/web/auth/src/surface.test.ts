import { describe, expect, it } from "vitest";

import {
  AUTH_SURFACE_ROUTES,
  authSurfacePath,
  authSurfaceRoute,
} from "./surface";

describe("canonical Auth surface", () => {
  it("keeps every owned destination unique and rooted", () => {
    const ids = AUTH_SURFACE_ROUTES.map((route) => route.id);
    const paths = AUTH_SURFACE_ROUTES.map((route) => route.pathname);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.startsWith("/"))).toBe(true);
  });

  it("resolves the account destinations used by product applications", () => {
    expect(authSurfacePath("account-security")).toBe("/account/security");
    expect(authSurfacePath("account-providers")).toBe("/account/providers");
    expect(authSurfacePath("logout")).toBe("/logout");
    expect(authSurfaceRoute("mfa").area).toBe("security");
  });
});
