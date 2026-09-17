import { describe, expect, it } from "vitest";

import {
  getPortfolioNavigationHref,
  includePortfolioNavigation,
  isPortfolioNavigationItemCurrent,
} from "./navigation";

describe("Portfolio navigation", () => {
  it("routes homepage navigation to canonical destinations", () => {
    expect(getPortfolioNavigationHref("home", "home")).toBe("/");
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

  it("routes homepage and analytics from CMS section keys", () => {
    expect(getPortfolioNavigationHref("home", "subpage")).toBe("/");
    expect(getPortfolioNavigationHref("hero", "home")).toBe("/");
    expect(getPortfolioNavigationHref("analytics", "subpage")).toBe(
      "/analytics",
    );
    expect(isPortfolioNavigationItemCurrent("home", "/")).toBe(true);
    expect(isPortfolioNavigationItemCurrent("analytics", "/analytics")).toBe(
      true,
    );
    expect(getPortfolioNavigationHref("github_activity", "home")).toBe(
      "/#github-activity",
    );
  });

  it("keeps CMS navigation order without injecting extra items", () => {
    const items = [
      { key: "home", label: "Home", note: "Portfolio overview" },
      { key: "work", label: "Work", note: "Selected work" },
      { key: "analytics", label: "Analytics", note: "Live site traffic" },
    ];

    expect(includePortfolioNavigation(items)).toEqual(items);
  });

  it("marks dedicated destinations as current", () => {
    expect(isPortfolioNavigationItemCurrent("home", "/")).toBe(true);
    expect(isPortfolioNavigationItemCurrent("home", "/about")).toBe(false);
    expect(isPortfolioNavigationItemCurrent("work", "/work")).toBe(true);
    expect(isPortfolioNavigationItemCurrent("writing", "/writing/auth")).toBe(
      true,
    );
    expect(isPortfolioNavigationItemCurrent("resume", "/resume")).toBe(true);
    expect(isPortfolioNavigationItemCurrent("about", "/resume")).toBe(false);
  });
});
