import { afterEach, describe, expect, it, vi } from "vitest";

import { getWordleSolutionForSession } from "./wordle.server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Wordle session solution", () => {
  it("is deterministic for a session and purpose-specific secret", () => {
    vi.stubEnv(
      "WORDLE_SEED_SECRET",
      "wordle-only-secret-with-at-least-32-characters",
    );

    const first = getWordleSolutionForSession("session-1");
    expect(getWordleSolutionForSession("session-1")).toBe(first);
    expect(getWordleSolutionForSession("session-2")).not.toBe(first);
  });

  it("does not fall back to Supabase credentials or public configuration", () => {
    vi.stubEnv("WORDLE_SEED_SECRET", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-is-not-a-game-seed");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");

    expect(() => getWordleSolutionForSession("session-1")).toThrow(
      "WORDLE_SEED_SECRET must contain at least 32 characters",
    );
  });
});
