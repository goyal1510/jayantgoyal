import { describe, expect, it } from "vitest";

import {
  getSectionLabel,
  validateSectionLabels,
} from "./section-copy";

describe("section copy labels", () => {
  it("rejects labels that do not belong to the section", () => {
    expect(validateSectionLabels("about", { readCta: "Read" })).toEqual([
      "copy.labels.readCta is not writable for about",
    ]);
  });

  it("returns the named label or a fallback", () => {
    expect(
      getSectionLabel({ readCta: "Open note" }, "readCta", "Read article"),
    ).toBe("Open note");
    expect(getSectionLabel({}, "readCta", "Read article")).toBe("Read article");
  });
});
