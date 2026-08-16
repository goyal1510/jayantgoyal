import { describe, expect, it } from "vitest";

import { PERSON_IDENTITY, PRODUCT_IDENTITIES } from "./index";

describe("ecosystem identity", () => {
  it("uses Jayant as the repository and product identity", () => {
    expect(PERSON_IDENTITY.fullName).toBe("Jayant");
    expect(PERSON_IDENTITY.monogram).toBe("JG");
  });

  it("keeps stable product identifiers independent from clients", () => {
    expect(PRODUCT_IDENTITIES.portfolio.name).toBe("Portfolio");
    expect(PRODUCT_IDENTITIES.studio.name).toBe("Studio");
    expect(PRODUCT_IDENTITIES.admin.name).toBe("Admin");
    expect(PRODUCT_IDENTITIES.auth.name).toBe("Auth");
  });

  it("does not use the monogram as written product branding", () => {
    for (const product of Object.values(PRODUCT_IDENTITIES)) {
      expect(product.name).not.toContain(PERSON_IDENTITY.monogram);
      expect(product.publicName).not.toContain(`${PERSON_IDENTITY.monogram} `);
    }
  });
});
