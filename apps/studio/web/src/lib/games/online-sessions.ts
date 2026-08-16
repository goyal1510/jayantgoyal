const ONLINE_GAME_SLUGS = [
  "rock-paper-scissors",
  "tic-tac-toe",
  "dare-x",
  "connect-four",
  "memory-match",
  "wordle",
  "typing-speed",
  "chess",
  "ludo",
] as const

export type OnlineGameSlug = (typeof ONLINE_GAME_SLUGS)[number]

export type JsonObject = Record<string, unknown>

export type OnlineSessionBundle = {
  session: JsonObject
  participants: JsonObject[]
  moves: JsonObject[]
  result: JsonObject | null
}

const ONLINE_GAME_SLUG_SET = new Set<string>(ONLINE_GAME_SLUGS)
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function isOnlineGameSlug(value: unknown): value is OnlineGameSlug {
  return typeof value === "string" && ONLINE_GAME_SLUG_SET.has(value)
}

export function normalizeRoomCode(value: unknown): string | null {
  if (typeof value !== "string") return null
  const roomCode = value.trim().toUpperCase()
  return /^[A-Z0-9]{6,10}$/.test(roomCode) ? roomCode : null
}

export function createRoomCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length]).join("")
}

export function normalizeDisplayName(value: unknown, fallback = "Player"): string {
  if (typeof value !== "string") return fallback
  const displayName = value.trim().replace(/\s+/g, " ").slice(0, 80)
  return displayName || fallback
}

export function asJsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as JsonObject
}

export function getSeatForIndex(gameSlug: OnlineGameSlug, index: number): string {
  if (gameSlug === "connect-four") return index === 0 ? "R" : "Y"
  if (gameSlug === "tic-tac-toe") return index === 0 ? "X" : "O"
  if (gameSlug === "chess") return index === 0 ? "W" : "B"
  return `P${index + 1}`
}

export function getMaxPlayersForGame(gameSlug: OnlineGameSlug): number {
  if (gameSlug === "dare-x") return 8
  if (gameSlug === "ludo") return 4
  return 2
}

export function normalizeMaxPlayersForGame(gameSlug: OnlineGameSlug, value: unknown): number {
  if (gameSlug !== "dare-x" && gameSlug !== "ludo") return getMaxPlayersForGame(gameSlug)
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed)) return 2
  const maxPlayers = gameSlug === "ludo" ? 4 : 8
  return Math.min(Math.max(Math.trunc(parsed), 2), maxPlayers)
}

export function isSafeJsonPayload(value: unknown, maxBytes = 20_000): boolean {
  try {
    return JSON.stringify(value).length <= maxBytes
  } catch {
    return false
  }
}
