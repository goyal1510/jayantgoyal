import { asJsonObject, type JsonObject } from "@/lib/games/online-sessions"

export type MemoryMatchSeat = "P1" | "P2"

export type MemoryMatchCard = {
  id: number
  value: number
  flipped: boolean
  matched: boolean
}

export type MemoryMatchState = {
  cards: MemoryMatchCard[]
  currentSeat: MemoryMatchSeat
  selectedCards: number[]
  scores: Record<MemoryMatchSeat, number>
  moves: number
  winner: MemoryMatchSeat | null
  isDraw: boolean
  lastMove: {
    seat: MemoryMatchSeat
    cardIds: number[]
    matched: boolean | null
  } | null
  difficulty: MemoryMatchDifficulty
}

export const MEMORY_MATCH_DIFFICULTIES = {
  easy: { label: "Easy (3 pairs)", pairs: 3, columns: 3 },
  medium: { label: "Medium (6 pairs)", pairs: 6, columns: 4 },
  hard: { label: "Hard (8 pairs)", pairs: 8, columns: 4 },
} as const

export type MemoryMatchDifficulty = keyof typeof MEMORY_MATCH_DIFFICULTIES

export const DEFAULT_MEMORY_MATCH_STATE: MemoryMatchState = {
  cards: [],
  currentSeat: "P1",
  selectedCards: [],
  scores: { P1: 0, P2: 0 },
  moves: 0,
  winner: null,
  isDraw: false,
  lastMove: null,
  difficulty: "medium",
}

export function isMemoryMatchDifficulty(value: unknown): value is MemoryMatchDifficulty {
  return typeof value === "string" && value in MEMORY_MATCH_DIFFICULTIES
}

export function createMemoryMatchState(difficulty: MemoryMatchDifficulty = "medium"): MemoryMatchState {
  const pairs = MEMORY_MATCH_DIFFICULTIES[difficulty].pairs
  const values = Array.from({ length: pairs }, (_, index) => index + 1)
  const deck = [...values, ...values]

  for (let index = deck.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[swapIndex]] = [deck[swapIndex]!, deck[index]!]
  }

  return {
    ...DEFAULT_MEMORY_MATCH_STATE,
    cards: deck.map((value, index) => ({
      id: index,
      value,
      flipped: false,
      matched: false,
    })),
    scores: { P1: 0, P2: 0 },
    difficulty,
  }
}

function parseCard(value: unknown): MemoryMatchCard | null {
  const card = asJsonObject(value)
  if (
    typeof card.id !== "number" ||
    !Number.isInteger(card.id) ||
    typeof card.value !== "number" ||
    !Number.isInteger(card.value)
  ) {
    return null
  }

  return {
    id: card.id,
    value: card.value,
    flipped: card.flipped === true,
    matched: card.matched === true,
  }
}

export function parseMemoryMatchState(value: unknown): MemoryMatchState {
  const state = asJsonObject(value)
  const cards = Array.isArray(state.cards)
    ? state.cards.map(parseCard).filter((card): card is MemoryMatchCard => Boolean(card))
    : []
  const currentSeat = state.currentSeat === "P2" ? "P2" : "P1"
  const rawScores = asJsonObject(state.scores)
  const difficulty = isMemoryMatchDifficulty(state.difficulty) ? state.difficulty : "medium"
  const lastMove = asJsonObject(state.lastMove)
  const lastMoveSeat = lastMove.seat === "P2" ? "P2" : lastMove.seat === "P1" ? "P1" : null

  return {
    cards,
    currentSeat,
    selectedCards: Array.isArray(state.selectedCards)
      ? state.selectedCards.filter((cardId): cardId is number => Number.isInteger(cardId))
      : [],
    scores: {
      P1: typeof rawScores.P1 === "number" ? rawScores.P1 : 0,
      P2: typeof rawScores.P2 === "number" ? rawScores.P2 : 0,
    },
    moves: typeof state.moves === "number" ? state.moves : 0,
    winner: state.winner === "P1" || state.winner === "P2" ? state.winner : null,
    isDraw: state.isDraw === true,
    lastMove: lastMoveSeat
      ? {
          seat: lastMoveSeat,
          cardIds: Array.isArray(lastMove.cardIds)
            ? lastMove.cardIds.filter((cardId): cardId is number => Number.isInteger(cardId))
            : [],
          matched: typeof lastMove.matched === "boolean" ? lastMove.matched : null,
        }
      : null,
    difficulty,
  }
}

export function nextMemoryMatchSeat(seat: MemoryMatchSeat): MemoryMatchSeat {
  return seat === "P1" ? "P2" : "P1"
}

export function getMemoryMatchWinner(scores: Record<MemoryMatchSeat, number>): MemoryMatchSeat | null {
  if (scores.P1 === scores.P2) return null
  return scores.P1 > scores.P2 ? "P1" : "P2"
}

export function memoryMatchStateToJson(state: MemoryMatchState): JsonObject {
  return state as unknown as JsonObject
}
