import { createHmac } from "node:crypto";

import { SOLUTION_WORDS } from "@/lib/games/words";

export function getWordleSolutionForSession(sessionId: string): string {
  const seed = process.env.WORDLE_SEED_SECRET;
  if (!seed || seed.length < 32) {
    throw new Error("WORDLE_SEED_SECRET must contain at least 32 characters");
  }

  const digest = createHmac("sha256", seed).update(sessionId).digest();
  const index = digest.readUInt32BE(0) % SOLUTION_WORDS.length;
  return SOLUTION_WORDS[index]!;
}
