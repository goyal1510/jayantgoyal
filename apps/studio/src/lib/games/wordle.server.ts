import { createHmac } from "node:crypto"

import { SOLUTION_WORDS } from "@/lib/games/words"

export function getWordleSolutionForSession(sessionId: string): string {
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "wordle"
  const digest = createHmac("sha256", seed).update(sessionId).digest()
  const index = digest.readUInt32BE(0) % SOLUTION_WORDS.length
  return SOLUTION_WORDS[index]!
}
