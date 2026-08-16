import { describe, expect, it } from "vitest";

import { gameSupportsFilter, getGamePlayLabels } from "./catalog";

describe("Game Hub catalog", () => {
  it("derives accurate play capabilities from the game registry", () => {
    expect(getGamePlayLabels("tic-tac-toe")).toEqual([
      "Solo",
      "Local",
      "Online",
    ]);
    expect(getGamePlayLabels("wordle")).toEqual(["Solo", "Online"]);
    expect(getGamePlayLabels("chess")).toEqual(["Local", "Online"]);
  });

  it("filters games without inventing unavailable modes", () => {
    expect(gameSupportsFilter("typing-speed", "solo")).toBe(true);
    expect(gameSupportsFilter("typing-speed", "online")).toBe(false);
    expect(gameSupportsFilter("tic-tac-toe", "online")).toBe(true);
    expect(gameSupportsFilter("rock-paper-scissors", "local")).toBe(false);
    expect(gameSupportsFilter("ludo", "local")).toBe(false);
    expect(gameSupportsFilter("ludo", "online")).toBe(true);
  });
});
