export type DareXAction = "get_dare" | "done" | "not_done"
type DareXAttemptStatus = "done" | "not_done"

export type DareXHistoryEntry = {
  id: string
  seat: string
  playerName: string
  dare: string
  status: DareXAttemptStatus
  createdAt: string
}

export type DareXState = {
  dares: string[]
  currentSeat: string
  currentDare: string | null
  round: number
  targetRounds: number
  completed: Record<string, { done: string[]; skipped: string[] }>
  history: DareXHistoryEntry[]
}

const FALLBACK_ONLINE_DARES = [
  "Do 10 jumping jacks.",
  "Sing a line from your favorite song.",
  "Share a fun fact you know.",
  "Do a silly dance for 10 seconds.",
  "Tell a joke.",
] as const

export function createDareXState({
  dares,
  currentSeat = "P1",
  targetRounds = 12,
}: {
  dares: string[]
  currentSeat?: string
  targetRounds?: number
}): DareXState {
  return {
    dares: normalizeDares(dares),
    currentSeat,
    currentDare: null,
    round: 1,
    targetRounds: Math.min(Math.max(Math.trunc(targetRounds), 1), 50),
    completed: {},
    history: [],
  }
}

export function isDareXAction(value: unknown): value is DareXAction {
  return value === "get_dare" || value === "done" || value === "not_done"
}

function normalizeDares(value: unknown): string[] {
  if (!Array.isArray(value)) return [...FALLBACK_ONLINE_DARES]
  const dares = value
    .filter((dare): dare is string => typeof dare === "string")
    .map((dare) => dare.trim())
    .filter(Boolean)
    .slice(0, 200)
  return dares.length > 0 ? dares : [...FALLBACK_ONLINE_DARES]
}

export function parseDareXState(value: unknown): DareXState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createDareXState({ dares: [...FALLBACK_ONLINE_DARES] })
  }

  const state = value as Partial<DareXState>
  return {
    dares: normalizeDares(state.dares),
    currentSeat: typeof state.currentSeat === "string" ? state.currentSeat : "P1",
    currentDare: typeof state.currentDare === "string" ? state.currentDare : null,
    round: typeof state.round === "number" && state.round > 0 ? state.round : 1,
    targetRounds: typeof state.targetRounds === "number" && state.targetRounds > 0 ? state.targetRounds : 12,
    completed: state.completed && typeof state.completed === "object" && !Array.isArray(state.completed) ? state.completed : {},
    history: Array.isArray(state.history) ? state.history.slice(0, 100) : [],
  }
}

export function getAvailableDaresForSeat(state: DareXState, seat: string): string[] {
  const completed = state.completed[seat] ?? { done: [], skipped: [] }
  return state.dares.filter((dare) => !completed.done.includes(dare) && !completed.skipped.includes(dare))
}

export function pickDareForSeat(state: DareXState, seat: string): string {
  const pool = getAvailableDaresForSeat(state, seat)
  const source = pool.length > 0 ? pool : state.dares
  return source[Math.floor(Math.random() * source.length)] ?? FALLBACK_ONLINE_DARES[0]
}
