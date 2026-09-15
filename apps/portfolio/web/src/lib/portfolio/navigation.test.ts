import { describe, expect, it } from "vitest";

import {
  getPortfolioNavigationHref,
  includeAnalyticsNavigation,
  isPortfolioNavigationItemCurrent,
} from "./navigation";

describe("Portfolio navigation", () => {
  it("routes homepage navigation to canonical destinations", () => {
    expect(getPortfolioNavigationHref("about", "home")).toBe("/about");
    expect(getPortfolioNavigationHref("work", "home")).toBe("/work");
    expect(getPortfolioNavigationHref("writing", "home")).toBe("/writing");
  });

  it("routes navigation to canonical public destinations", () => {
    expect(getPortfolioNavigationHref("work", "subpage")).toBe("/work");
    expect(getPortfolioNavigationHref("writing", "subpage")).toBe("/writing");
    expect(getPortfolioNavigationHref("about", "subpage")).toBe("/about");
  });

  it("routes Resume to its dedicated page from every surface", () => {
    expect(getPortfolioNavigationHref("resume", "home")).toBe("/resume");
    expect(getPortfolioNavigationHref("resume", "subpage")).toBe("/resume");
  });

  it("exposes Analytics as a canonical destination", () => {
    expect(getPortfolioNavigationHref("analytics", "home")).toBe("/analytics");
    expect(isPortfolioNavigationItemCurrent("analytics", "/analytics")).toBe(
      true,
    );
  });

  it("adds Analytics to CMS navigation exactly once", () => {
    const items = [{ key: "work", label: "Work", note: "Selected work" }];
    const withAnalytics = includeAnalyticsNavigation(items);

    expect(withAnalytics).toEqual([
      ...items,
      { key: "analytics", label: "Analytics", note: "Live site traffic" },
    ]);
    expect(includeAnalyticsNavigation(withAnalytics)).toBe(withAnalytics);
  });

  it("marks dedicated destinations as current", () => {
    expect(isPortfolioNavigationItemCurrent("work", "/work")).toBe(true);
    expect(isPortfolioNavigationItemCurrent("writing", "/writing/auth")).toBe(
      true,
    );
    expect(isPortfolioNavigationItemCurrent("resume", "/resume")).toBe(true);
    expect(isPortfolioNavigationItemCurrent("about", "/resume")).toBe(false);
  });
});
