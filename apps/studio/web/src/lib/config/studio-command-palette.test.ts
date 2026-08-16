import { describe, expect, it } from "vitest";

import { buildStudioSearchGroups } from "./studio-command-palette";

describe("Studio command palette index", () => {
  it("retains the app-owned surface, workspace, game, and tool groups", () => {
    const groups = buildStudioSearchGroups();

    expect(groups.map((group) => group.id)).toEqual(
      expect.arrayContaining(["studio", "products", "workspaces", "game-hub"]),
    );
    expect(groups.find((group) => group.id === "studio")?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "studio-home" }),
        expect.objectContaining({ id: "writing" }),
        expect.objectContaining({ id: "portfolio" }),
      ]),
    );
    expect(groups.find((group) => group.id === "workspaces")?.items.length).toBeGreaterThan(0);
    expect(groups.some((group) => group.id.startsWith("tools-"))).toBe(true);
  });

  it("preserves explicit external destinations", () => {
    const groups = buildStudioSearchGroups();
    const externalItems = groups.flatMap((group) => group.items).filter((item) => item.external);

    expect(externalItems.length).toBeGreaterThan(0);
    expect(externalItems.every((item) => item.href.startsWith("http"))).toBe(true);
  });
});
