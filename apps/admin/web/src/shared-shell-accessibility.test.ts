import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sharedSource = (file: string) =>
  readFileSync(
    new URL(
      `../../../../packages/web/ui/src/components/${file}`,
      import.meta.url,
    ),
    "utf8",
  );

describe("shared shell accessibility contracts", () => {
  it("keeps the sidebar rail keyboard reachable and toggleable", () => {
    const sidebar = sharedSource("sidebar.tsx");

    expect(sidebar).toContain('aria-label="Toggle Sidebar"');
    expect(sidebar).toContain("tabIndex={0}");
    expect(sidebar).toContain('event.key === "Enter"');
    expect(sidebar).toContain('event.key === " "');
    expect(sidebar).toContain("focus-visible:ring-2");
  });

  it("keeps theme and account actions on Radix's keyboard selection path", () => {
    const themeMenu = sharedSource("theme-menu.tsx");
    const userMenu = sharedSource("application-user-menu.tsx");

    expect(themeMenu).toContain('aria-label="Choose theme"');
    expect(themeMenu).toContain("onSelect={() => setTheme(id)}");
    expect(userMenu).toContain("aria-label={`${user.name} account menu`}");
    expect(userMenu).toContain("onSelect={onSettings}");
    expect(userMenu).toContain("onSignOut()");
  });

  it("keeps collapsed navigation labels available through tooltips", () => {
    const sidebarMenu = sharedSource("sidebar-menu.tsx");

    expect(sidebarMenu).toContain('hidden={state !== "collapsed" || isMobile}');
    expect(sidebarMenu).toContain("TooltipTrigger asChild");
  });
});
