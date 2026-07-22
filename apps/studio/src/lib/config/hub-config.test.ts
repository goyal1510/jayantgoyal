import { describe, expect, it } from "vitest";

import {
  getSurfaceApps,
  toApplicationNavigationItem,
} from "@/lib/config/hub-config";

describe("Studio navigation adapter", () => {
  it("preserves active product and nested destination state", () => {
    const app = getSurfaceApps().find(
      (candidate) => candidate.id === "game-hub",
    );

    expect(app).toBeDefined();

    const item = toApplicationNavigationItem(app!, "game-hub", "chess");

    expect(item.isActive).toBe(true);
    expect(item.defaultOpen).toBe(true);
    expect(item.children?.find((child) => child.id === "chess")).toMatchObject({
      isActive: true,
      href: "/games/chess",
    });
  });

  it("keeps external surfaces explicit for the shared renderer", () => {
    const app = getSurfaceApps().find((candidate) => candidate.externalUrl);

    expect(app).toBeDefined();

    const item = toApplicationNavigationItem(app!);

    expect(item.external).toBe(true);
    expect(item.href).toBe(app!.externalUrl);
  });

  it("exposes Media Lab as its own nested application", () => {
    const app = getSurfaceApps().find(
      (candidate) => candidate.id === "media-lab",
    );

    expect(app).toBeDefined();
    expect(
      toApplicationNavigationItem(app!, "media-lab", "youtube-converter"),
    ).toMatchObject({
      isActive: true,
      children: [
        expect.objectContaining({
          id: "youtube-converter",
          label: "YouTube Converter",
          isActive: true,
        }),
      ],
    });
  });
});
