import { describe, expect, it } from "vitest";

import {
  APP_BRANDS,
  APP_SOCIAL_PREVIEW_IMAGES,
  formatAppPageTitle,
  PERSON_BRAND,
} from "./index";

describe("web branding", () => {
  it("adds web metadata to the canonical product identities", () => {
    expect(APP_BRANDS.portfolio.defaultTitle).toContain(PERSON_BRAND.fullName);
    expect(APP_BRANDS.studio.publicName).toBe("Studio by Jayant");
    expect(APP_BRANDS.admin.publicName).toBe("Admin by Jayant");
    expect(APP_BRANDS.auth.publicName).toBe("Auth by Jayant");
  });

  it("formats client page titles consistently", () => {
    expect(formatAppPageTitle("portfolio", "Writing")).toBe("Writing | Jayant");
    expect(formatAppPageTitle("studio", "UUID Generator")).toBe(
      "UUID Generator | Studio",
    );
    expect(formatAppPageTitle("admin", "Users")).toBe("Users | Admin");
  });

  it("uses canonical screenshot crops for web link previews", () => {
    for (const preview of Object.values(APP_SOCIAL_PREVIEW_IMAGES)) {
      expect(preview.url).toMatch(
        /^https:\/\/jayantgoyal\.com\/images\/social\/.+-preview\.jpg\?v=\d+$/,
      );
      expect(preview.width).toBe(1200);
      expect(preview.height).toBe(630);
      expect(preview.type).toBe("image/jpeg");
    }
  });
});
