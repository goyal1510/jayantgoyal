import { describe, expect, it } from "vitest";

import { GAME_META } from "@/lib/games/config";
import { GAME_PRESENTATION } from "@/lib/games/presentation";

describe("game presentation registry", () => {
  it("covers every canonical game without extra entries", () => {
    expect(Object.keys(GAME_PRESENTATION).sort()).toEqual(
      Object.keys(GAME_META).sort(),
    );
  });

  it("provides an icon and Studio surface tokens for every game", () => {
    Object.values(GAME_PRESENTATION).forEach((presentation) => {
      expect(presentation.icon).toBeTruthy();
      expect(presentation.tone).toContain("border-");
      expect(presentation.tone).toContain("bg-");
      expect(presentation.tone).toContain("text-");
    });
  });
});
