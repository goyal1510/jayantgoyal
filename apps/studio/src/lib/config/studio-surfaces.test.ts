import { describe, expect, it } from "vitest";

import { getAppById, getSurfaceApps } from "./hub-config";
import { STUDIO_SURFACES } from "./studio-surfaces";
import { getToolByPath } from "@/lib/tools/tools";

describe("Studio surface registry", () => {
  it("uses unique identifiers and canonical routes", () => {
    const surfaces = Object.values(STUDIO_SURFACES);
    const ids = surfaces.map((surface) => surface.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(STUDIO_SURFACES["tech-tools"]).toMatchObject({
      name: "Tech Tools",
      href: "/tools",
    });
    expect(STUDIO_SURFACES["media-lab"]).toMatchObject({
      name: "Media Lab",
      href: "/media-lab/youtube-converter",
      isPublic: false,
    });
    expect(STUDIO_SURFACES["game-hub"]).toMatchObject({
      name: "Game Hub",
      href: "/games",
    });
    expect(STUDIO_SURFACES["custom-calculator"]).toMatchObject({
      name: "Calculator Builder",
      href: "/custom-calculator",
    });
  });

  it("exposes every direct discovery destination", () => {
    const surfaceIds = getSurfaceApps().map((surface) => surface.id);

    expect(surfaceIds).toEqual(
      expect.arrayContaining([
        "studio-home",
        "studio-products",
        "tech-tools",
        "media-lab",
        "weather",
        "github-stats",
      ]),
    );
  });

  it("uses All Games for the Game Hub root destination", () => {
    expect(getAppById("game-hub")?.navItems[0]).toMatchObject({
      label: "All Games",
      url: "/games",
    });
  });

  it("keeps YouTube Converter outside Tech Tools", () => {
    expect(getAppById("media-lab")?.navItems[0]).toMatchObject({
      id: "youtube-converter",
      label: "YouTube Converter",
      url: "/media-lab/youtube-converter",
    });
    expect(getToolByPath("/tools/media-qr/media-converter")).toBeUndefined();
  });

  it("keeps Blog and Portfolio as explicit external destinations", () => {
    expect(STUDIO_SURFACES.blog.external).toBe(true);
    expect(STUDIO_SURFACES.portfolio.external).toBe(true);
    expect(STUDIO_SURFACES.blog.href).toMatch(/^https:\/\//);
    expect(STUDIO_SURFACES.portfolio.href).toMatch(/^https:\/\//);
  });
});
