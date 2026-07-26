import { describe, expect, it } from "vitest";

import { resolveContactContext } from "./context";

const work = [
  { id: "portfolio", title: "Portfolio" },
  { id: "studio", title: "Studio" },
];

describe("contact context", () => {
  it("prefills a qualified message from a known Work case study", () => {
    expect(
      resolveContactContext(
        { source: "work-case-study", project: "studio" },
        work,
      ),
    ).toEqual({
      leadSource: "work_case_study",
      initialProject:
        "I’d like to discuss a product after reading the Studio case study.",
    });
  });

  it("does not reflect arbitrary query content into the contact form", () => {
    expect(
      resolveContactContext(
        { source: "work-case-study", project: "<script>" },
        work,
      ),
    ).toEqual({ leadSource: "direct" });
  });
});
