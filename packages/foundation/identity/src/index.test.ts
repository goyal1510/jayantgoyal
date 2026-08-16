import { describe, expect, it } from "vitest";

import {
  PERSON_IDENTITY,
  PRODUCT_IDENTITIES,
  TECHNICAL_IDENTITY,
} from "./index";

describe("foundation identity", () => {
  it("keeps the public person separate from technical identifiers", () => {
    expect(PERSON_IDENTITY.displayName).toBe("Jayant");
    expect(PERSON_IDENTITY.officialName).toBe("Jayant");
    expect(PERSON_IDENTITY.shortMark).toBe("jg");
    expect(TECHNICAL_IDENTITY.repositoryName).toBe("jayantgoyal");
    expect(TECHNICAL_IDENTITY.packageScope).toBe("@jayantgoyal");
  });

  it("keeps stable product identifiers independent from clients", () => {
    expect(PRODUCT_IDENTITIES.portfolio.name).toBe("Portfolio");
    expect(PRODUCT_IDENTITIES.studio.name).toBe("Studio");
    expect(PRODUCT_IDENTITIES.admin.name).toBe("Admin");
    expect(PRODUCT_IDENTITIES.auth.name).toBe("Auth");
  });

  it("owns canonical origins and hosts without inventing an umbrella brand", () => {
    expect(PRODUCT_IDENTITIES.portfolio.canonicalOrigin).toBe(
      "https://jayantgoyal.com",
    );
    expect(PRODUCT_IDENTITIES.auth.canonicalHosts).toEqual([
      "auth.jayantgoyal.com",
    ]);
  });

  it("does not use the short mark as written product branding", () => {
    for (const product of Object.values(PRODUCT_IDENTITIES)) {
      expect(product.name.toLowerCase()).not.toContain(
        PERSON_IDENTITY.shortMark,
      );
      expect(product.publicName.toLowerCase()).not.toContain(
        `${PERSON_IDENTITY.shortMark} `,
      );
    }
  });
});
