import { describe, expect, it } from "vitest";

import { APP_BRANDS, formatAppPageTitle, PERSON_BRAND } from "./index";

describe("canonical platform branding", () => {
  it("uses the full public identity in app-level metadata", () => {
    expect(APP_BRANDS.portfolio.defaultTitle).toContain(PERSON_BRAND.fullName);
    expect(APP_BRANDS.studio.defaultTitle).toContain(PERSON_BRAND.fullName);
    expect(APP_BRANDS.admin.defaultTitle).toContain(PERSON_BRAND.fullName);
    expect(APP_BRANDS.studio.publicName).toBe("Studio by Jayant Goyal");
    expect(APP_BRANDS.admin.publicName).toBe("Admin by Jayant Goyal");
  });

  it("keeps application names independent from public SEO names", () => {
    expect(APP_BRANDS.portfolio.name).toBe("Portfolio");
    expect(APP_BRANDS.studio.name).toBe("Studio");
    expect(APP_BRANDS.admin.name).toBe("Admin");
  });

  it("does not use the monogram as written application branding", () => {
    for (const app of Object.values(APP_BRANDS)) {
      expect(app.name).not.toContain(PERSON_BRAND.monogram);
      expect(app.defaultTitle).not.toContain(`${PERSON_BRAND.monogram} `);
    }
  });

  it("formats page-level social titles from the same app contract", () => {
    expect(formatAppPageTitle("portfolio", "Blog")).toBe("Blog | Jayant Goyal");
    expect(formatAppPageTitle("studio", "UUID Generator")).toBe(
      "UUID Generator | Studio",
    );
    expect(formatAppPageTitle("admin", "Users")).toBe("Users | Admin");
  });

  it("keeps ownership wording out of repeated page-title suffixes", () => {
    expect(APP_BRANDS.studio.titleTemplate).toBe("%s | Studio");
    expect(APP_BRANDS.admin.titleTemplate).toBe("%s | Admin");
    expect(formatAppPageTitle("studio", "Weather")).not.toContain(" by ");
    expect(formatAppPageTitle("admin", "Deployments")).not.toContain(" by ");
  });
});
