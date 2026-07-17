import { describe, expect, it } from "vitest";

import {
  adminNavigationDomains,
  getAdminNavigationContext,
  getVisibleAdminNavigationDomains,
  isAdminNavigationItemActive,
} from "./nav-config";

describe("Admin navigation domains", () => {
  it("uses the approved Portfolio, Studio, and System organization", () => {
    expect(adminNavigationDomains.map((domain) => domain.label)).toEqual([
      "Portfolio",
      "Studio",
      "System",
    ]);
    expect(
      adminNavigationDomains
        .find((domain) => domain.id === "portfolio")
        ?.items.some((item) => item.href === "/blog"),
    ).toBe(true);
    expect(
      adminNavigationDomains.find((domain) => domain.id === "studio")?.items,
    ).toEqual([]);
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
    expect(getAdminNavigationContext("/blog")?.domain.id).toBe("portfolio");
    expect(getAdminNavigationContext("/deployments")?.domain.id).toBe("system");
    expect(getAdminNavigationContext("/users")?.domain.id).toBe("system");
    expect(getAdminNavigationContext("/deployments/env")).toBeNull();
    expect(getAdminNavigationContext("/deployments/example")?.pageLabel).toBe(
      "Deployment Detail",
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
