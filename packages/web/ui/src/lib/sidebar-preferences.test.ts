import { describe, expect, it } from "vitest";

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  clampSidebarWidth,
  parseSidebarPreferences,
} from "./sidebar-preferences";

describe("sidebar preferences", () => {
  it("uses the shared open and width defaults when cookies are absent", () => {
    expect(parseSidebarPreferences({})).toEqual({
      defaultOpen: true,
      defaultWidth: SIDEBAR_DEFAULT_WIDTH,
    });
  });

  it("restores the exact collapsed cookie contract", () => {
    expect(parseSidebarPreferences({ state: "false", width: "320" })).toEqual({
      defaultOpen: false,
      defaultWidth: 320,
    });
  });

  it("clamps persisted widths to the supported range", () => {
    expect(clampSidebarWidth(-1)).toBe(SIDEBAR_MIN_WIDTH);
    expect(clampSidebarWidth(999)).toBe(SIDEBAR_MAX_WIDTH);
  });

  it("falls back when the persisted width is empty or invalid", () => {
    expect(parseSidebarPreferences({ width: "0" }).defaultWidth).toBe(
      SIDEBAR_DEFAULT_WIDTH,
    );
    expect(
      parseSidebarPreferences({ width: "not-a-number" }).defaultWidth,
    ).toBe(SIDEBAR_DEFAULT_WIDTH);
  });
});
