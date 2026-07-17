import { describe, expect, it } from "vitest";

import { getInternalRouteChangePath } from "./route-change";

const currentUrl = "https://studio.jayantgoyal.com/tools?tab=all";

describe("internal route change detection", () => {
  it("recognizes relative and same-origin absolute route changes", () => {
    expect(
      getInternalRouteChangePath({
        href: "/weather?city=Delhi#forecast",
        currentPathname: "/tools",
        currentUrl,
      }),
    ).toBe("/weather");

    expect(
      getInternalRouteChangePath({
        href: "https://studio.jayantgoyal.com/files",
        currentPathname: "/tools",
        currentUrl,
      }),
    ).toBe("/files");
  });

  it.each(["#details", "?tab=favorites", "/tools"])(
    "ignores same-page navigation to %s",
    (href) => {
      expect(
        getInternalRouteChangePath({
          href,
          currentPathname: "/tools",
          currentUrl,
        }),
      ).toBeNull();
    },
  );

  it.each([
    "https://jayantgoyal.com/",
    "mailto:hello@jayantgoyal.com",
    "tel:+910000000000",
  ])("ignores navigation outside the current application: %s", (href) => {
    expect(
      getInternalRouteChangePath({
        href,
        currentPathname: "/tools",
        currentUrl,
      }),
    ).toBeNull();
  });

  it("ignores browser-native alternate navigation intents", () => {
    const common = {
      href: "/weather",
      currentPathname: "/tools",
      currentUrl,
    };

    expect(
      getInternalRouteChangePath({ ...common, target: "_blank" }),
    ).toBeNull();
    expect(
      getInternalRouteChangePath({ ...common, download: true }),
    ).toBeNull();
    expect(getInternalRouteChangePath({ ...common, metaKey: true })).toBeNull();
    expect(getInternalRouteChangePath({ ...common, ctrlKey: true })).toBeNull();
    expect(
      getInternalRouteChangePath({ ...common, shiftKey: true }),
    ).toBeNull();
    expect(getInternalRouteChangePath({ ...common, altKey: true })).toBeNull();
    expect(getInternalRouteChangePath({ ...common, button: 1 })).toBeNull();
  });
});
