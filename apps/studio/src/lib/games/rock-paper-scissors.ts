export type RpsChoice = "rock" | "paper" | "scissors"
export type RpsSeat = "P1" | "P2"
export type RpsRoundOutcome = "P1" | "P2" | "draw"

export type RpsState = {
  round: number
  targetWins: number
  scores: Record<RpsSeat, number> & { draws: number }
  pendingChoices: Partial<Record<RpsSeat, RpsChoice>>
  lastRound: {
    round: number
    choices: Record<RpsSeat, RpsChoice>
    outcome: RpsRoundOutcome
  } | null
}

export const RPS_CHOICES: RpsChoice[] = ["rock", "paper", "scissors"]

export const EMPTY_RPS_STATE: RpsState = {
  round: 1,
  targetWins: 3,
  scores: { P1: 0, P2: 0, draws: 0 },
  pendingChoices: {},
  lastRound: null,
}

export function isRpsChoice(value: unknown): value is RpsChoice {
  return value === "rock" || value === "paper" || value === "scissors"
}

export function isRpsSeat(value: unknown): value is RpsSeat {
  return value === "P1" || value === "P2"
}

export function resolveRpsRound(p1: RpsChoice, p2: RpsChoice): RpsRoundOutcome {
  if (p1 === p2) return "draw"
  if (
    (p1 === "rock" && p2 === "scissors") ||
    (p1 === "paper" && p2 === "rock") ||
    (p1 === "scissors" && p2 === "paper")
  ) {
    return "P1"
  }
  return "P2"
}

export function parseRpsState(value: unknown): RpsState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_RPS_STATE
  const state = value as Partial<RpsState>
  const pendingChoices: Partial<Record<RpsSeat, RpsChoice>> = {}
  if (isRpsChoice(state.pendingChoices?.P1)) pendingChoices.P1 = state.pendingChoices.P1
  if (isRpsChoice(state.pendingChoices?.P2)) pendingChoices.P2 = state.pendingChoices.P2

  return {
    round: typeof state.round === "number" && state.round > 0 ? state.round : 1,
    targetWins: typeof state.targetWins === "number" && state.targetWins > 0 ? state.targetWins : 3,
    scores: {
      P1: typeof state.scores?.P1 === "number" ? state.scores.P1 : 0,
      P2: typeof state.scores?.P2 === "number" ? state.scores.P2 : 0,
      draws: typeof state.scores?.draws === "number" ? state.scores.draws : 0,
    },
    pendingChoices,
    lastRound: state.lastRound ?? null,
  }
}
