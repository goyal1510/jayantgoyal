import { describe, expect, it } from "vitest";

import { preparePortfolioMutationPayload } from "./hero-identity";

describe("Portfolio hero identity compatibility", () => {
  it("injects fixed legacy columns only for hero creation", () => {
    expect(
      preparePortfolioMutationPayload(
        "hero",
        { role: "Software Engineer", headline: "Clear product systems" },
        "create",
      ),
    ).toEqual({
      role: "Software Engineer",
      headline: "Clear product systems",
      name: "Jayant",
      display_name: "Jayant",
      seo_title: "Jayant | Software Engineer",
    });
  });

  it("does not add identity columns to updates or other tables", () => {
    const update = { role: "Product Engineer" };
    const work = { name: "A case study" };

    expect(preparePortfolioMutationPayload("hero", update, "update")).toBe(
      update,
    );
    expect(preparePortfolioMutationPayload("work", work, "create")).toBe(work);
  });

  it("returns an empty safe payload for non-object input", () => {
    expect(preparePortfolioMutationPayload("hero", null, "create")).toEqual({});
  });
});
