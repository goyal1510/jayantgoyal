import { describe, expect, it } from "vitest";

import { APP_BRANDS, PERSON_BRAND } from "./index";

describe("canonical platform branding", () => {
  it("uses the full public identity in Portfolio and Studio metadata", () => {
    expect(APP_BRANDS.portfolio.defaultTitle).toContain(PERSON_BRAND.fullName);
    expect(APP_BRANDS.studio.defaultTitle).toContain(PERSON_BRAND.fullName);
    expect(APP_BRANDS.studio.publicName).toBe("Studio by Jayant Goyal");
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
});
