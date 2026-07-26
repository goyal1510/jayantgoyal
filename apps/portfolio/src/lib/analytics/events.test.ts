import { describe, expect, it } from "vitest";

import {
  compactAnalyticsParameters,
  isPortfolioAnalyticsEvent,
} from "./events";

describe("Portfolio analytics events", () => {
  it("accepts only the intentional conversion event inventory", () => {
    expect(isPortfolioAnalyticsEvent("generate_lead")).toBe(true);
    expect(isPortfolioAnalyticsEvent("select_content")).toBe(true);
    expect(isPortfolioAnalyticsEvent("email_address")).toBe(false);
  });

  it("removes missing values without dropping valid false or zero values", () => {
    expect(
      compactAnalyticsParameters({
        source: "work_case_study",
        item_id: undefined,
        engaged: false,
        position: 0,
      }),
    ).toEqual({
      source: "work_case_study",
      engaged: false,
      position: 0,
    });
  });
});
