import { describe, expect, it } from "vitest";

import {
  distinctiveHeadlinePhrases,
  echoHeadlineInBody,
} from "./headline-language";

const headline =
  "I build complete software products—from product decisions to production systems.";

describe("headline language echo", () => {
  it("splits the editorial headline on the em dash", () => {
    expect(distinctiveHeadlinePhrases(headline)).toEqual([
      "I build complete software products",
      "product decisions to production systems",
    ]);
  });

  it("leaves body copy unchanged when it already reuses the headline", () => {
    const body =
      "I build complete software products across product decisions to production systems and delivery.";

    expect(echoHeadlineInBody(headline, body)).toBe(body);
  });

  it("prefixes missing headline clauses before the existing introduction", () => {
    expect(
      echoHeadlineInBody(
        headline,
        "I work across interfaces, data, authentication, and delivery.",
      ),
    ).toBe(
      "I build complete software products. Product decisions to production systems. I work across interfaces, data, authentication, and delivery.",
    );
  });
});
