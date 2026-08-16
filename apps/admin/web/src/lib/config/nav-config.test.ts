import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { PORTFOLIO_WORKSPACE_ROUTES } from "@jayantgoyal/portfolio-contracts";

import {
  adminNavigationDomains,
  getAdminNavigationContext,
  getVisibleAdminNavigationDomains,
  isAdminNavigationItemActive,
} from "./nav-config";
import {
  getCanonicalAdminPath,
  PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS,
} from "./portfolio-route-map";

describe("Admin navigation domains", () => {
  it("uses the approved Portfolio, Studio, and Operations organization", () => {
    expect(adminNavigationDomains.map((domain) => domain.label)).toEqual([
      "Portfolio",
      "Studio",
      "Operations",
    ]);
    expect(
      adminNavigationDomains
        .find((domain) => domain.id === "portfolio")
        ?.items.some((item) => item.href === "/portfolio/writing"),
    ).toBe(true);
    expect(
      adminNavigationDomains
        .find((domain) => domain.id === "portfolio")
        ?.items.some((item) => item.href === "/portfolio/home"),
    ).toBe(true);
    expect(
      adminNavigationDomains.find((domain) => domain.id === "studio")?.items,
    ).toEqual([]);
    expect(
      adminNavigationDomains
        .find((domain) => domain.id === "portfolio")
        ?.items.some((item) => item.href === "/portfolio/tech-icons"),
    ).toBe(false);
  });

  it("keeps operational domains restricted to super admins", () => {
    expect(
      getVisibleAdminNavigationDomains("admin").map((domain) => domain.id),
    ).toEqual(["portfolio"]);
    expect(
      getVisibleAdminNavigationDomains("super_admin").map(
        (domain) => domain.id,
      ),
    ).toEqual(["portfolio", "system"]);
  });

  it("maps routes to their app-owned breadcrumb domain", () => {
    expect(getAdminNavigationContext("/writing")?.domain.id).toBe("portfolio");
    expect(getAdminNavigationContext("/writing")?.pageLabel).toBe("Writing");
    expect(getAdminNavigationContext("/deployments")?.domain.id).toBe("system");
    expect(getAdminNavigationContext("/users")?.domain.id).toBe("system");
    expect(getAdminNavigationContext("/deployments/env")).toBeNull();
    expect(getAdminNavigationContext("/deployments/example")?.pageLabel).toBe(
      "Deployment Detail",
    );
  });

  it("keeps every retired Portfolio destination pointed at one owning workspace", () => {
    expect(PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS).toEqual({
      "/portfolio/hero": "/portfolio/home",
      "/portfolio/projects": "/portfolio/work",
      "/portfolio/education": "/portfolio/about",
      "/portfolio/certificates": "/portfolio/experience",
      "/portfolio/github": "/portfolio/activity",
      "/portfolio/blog": "/portfolio/writing",
      "/blog": "/portfolio/writing",
      "/writing": "/portfolio/writing",
      "/portfolio/section-copy": "/portfolio",
      "/portfolio/navigation": "/portfolio",
    });

    for (const [legacyPath, canonicalPath] of Object.entries(
      PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS,
    )) {
      expect(getCanonicalAdminPath(legacyPath)).toBe(canonicalPath);
    }
    expect(getCanonicalAdminPath("/portfolio/about")).toBe("/portfolio/about");
  });

  it("keeps every canonical workspace and compatibility route backed by a page", () => {
    const adminRoot = fileURLToPath(new URL("../../../", import.meta.url));
    const canonicalPagePaths = Object.values(PORTFOLIO_WORKSPACE_ROUTES).map(
      (route) =>
        resolve(adminRoot, "src/app/(admin)", `${route.slice(1)}/page.tsx`),
    );

    expect(canonicalPagePaths.every((path) => existsSync(path))).toBe(true);
    for (const legacyPath of Object.keys(
      PORTFOLIO_LEGACY_ADMIN_ROUTE_TARGETS,
    )) {
      const route = legacyPath === "/writing" ? "/writing" : legacyPath;
      expect(
        existsSync(
          resolve(adminRoot, "src/app/(admin)", `${route.slice(1)}/page.tsx`),
        ),
      ).toBe(true);
    }
  });

  it("keeps legacy destinations active under their canonical section label", () => {
    expect(getAdminNavigationContext("/portfolio/education")?.pageLabel).toBe(
      "About",
    );
    expect(
      getAdminNavigationContext("/portfolio/certificates")?.pageLabel,
    ).toBe("Experience");
    expect(getAdminNavigationContext("/portfolio/navigation")?.pageLabel).toBe(
      "Overview",
    );
  });

  it("keeps deployment detail active without reviving the retired environment manager", () => {
    const system = adminNavigationDomains.find(
      (domain) => domain.id === "system",
    );
    const deployments = system?.items.find(
      (item) => item.href === "/deployments",
    );

    expect(deployments).toBeDefined();
    expect(
      deployments &&
        isAdminNavigationItemActive("/deployments/example", deployments),
    ).toBe(true);
    expect(
      deployments &&
        isAdminNavigationItemActive("/deployments/env", deployments),
    ).toBe(false);
    expect(system?.items.some((item) => item.href === "/deployments/env")).toBe(
      false,
    );
  });
});
