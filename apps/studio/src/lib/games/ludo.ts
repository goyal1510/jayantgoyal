import { asJsonObject, type JsonObject } from "@/lib/games/online-sessions"

export const LUDO_SEATS = ["P1", "P2", "P3", "P4"] as const
export type LudoSeat = (typeof LUDO_SEATS)[number]

export type LudoToken = {
  id: string
  seat: LudoSeat
  index: number
  progress: number
}

type LudoLastMove = {
  action: "roll" | "move" | "skip"
  seat: LudoSeat
  diceValue?: number
  tokenId?: string
  capturedTokenIds?: string[]
  finished?: boolean
}

export type LudoState = {
  activeSeats: LudoSeat[]
  currentSeat: LudoSeat
  tokens: LudoToken[]
  diceValue: number | null
  phase: "roll" | "move"
  turnNumber: number
  targetTokens: number
  winner: LudoSeat | null
  lastMove: LudoLastMove | null
}

const LUDO_FINISH_PROGRESS = 57
const LUDO_HOME_ENTRY_PROGRESS = 52
const LUDO_TOKENS_PER_PLAYER = 4

export const LUDO_SEAT_META: Record<LudoSeat, {
  label: string
  colorName: string
  startIndex: number
}> = {
  P1: { label: "Red", colorName: "red", startIndex: 0 },
  P2: { label: "Green", colorName: "green", startIndex: 13 },
  P3: { label: "Yellow", colorName: "yellow", startIndex: 26 },
  P4: { label: "Blue", colorName: "blue", startIndex: 39 },
}

export const LUDO_PATH_COORDINATES = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
] as const

export const LUDO_SAFE_GLOBAL_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47])

const LUDO_HOME_PATH_COORDINATES: Record<LudoSeat, readonly (readonly [number, number])[]> = {
  P1: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  P2: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  P3: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  P4: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
}

const LUDO_YARD_COORDINATES: Record<LudoSeat, readonly (readonly [number, number])[]> = {
  P1: [[2, 2], [2, 3], [3, 2], [3, 3]],
  P2: [[2, 11], [2, 12], [3, 11], [3, 12]],
  P3: [[11, 11], [11, 12], [12, 11], [12, 12]],
  P4: [[11, 2], [11, 3], [12, 2], [12, 3]],
}

export function createLudoState(maxPlayers = 2, targetTokens = LUDO_TOKENS_PER_PLAYER): LudoState {
  const playerCount = Math.min(Math.max(Math.trunc(maxPlayers), 2), 4)
  const activeSeats = LUDO_SEATS.slice(0, playerCount)
  return {
    activeSeats,
    currentSeat: "P1",
    tokens: activeSeats.flatMap((seat) =>
      Array.from({ length: LUDO_TOKENS_PER_PLAYER }, (_, index) => ({
        id: `${seat}-${index + 1}`,
        seat,
        index,
        progress: -1,
      }))
    ),
    diceValue: null,
    phase: "roll",
    turnNumber: 1,
    targetTokens: Math.min(Math.max(Math.trunc(targetTokens), 1), LUDO_TOKENS_PER_PLAYER),
    winner: null,
    lastMove: null,
  }
}

export function isLudoSeat(value: unknown): value is LudoSeat {
  return typeof value === "string" && (LUDO_SEATS as readonly string[]).includes(value)
}

function parseToken(value: unknown): LudoToken | null {
  const token = asJsonObject(value)
  if (!isLudoSeat(token.seat) || typeof token.index !== "number" || !Number.isInteger(token.index)) {
    return null
  }

  return {
    id: typeof token.id === "string" ? token.id : `${token.seat}-${token.index + 1}`,
    seat: token.seat,
    index: Math.min(Math.max(token.index, 0), LUDO_TOKENS_PER_PLAYER - 1),
    progress: typeof token.progress === "number"
      ? Math.min(Math.max(Math.trunc(token.progress), -1), LUDO_FINISH_PROGRESS)
      : -1,
  }
}

export function parseLudoState(value: unknown): LudoState {
  const state = asJsonObject(value)
  const activeSeats: LudoSeat[] = Array.isArray(state.activeSeats)
    ? state.activeSeats.filter(isLudoSeat)
    : ["P1", "P2"]
  const seats: LudoSeat[] = activeSeats.length >= 2 ? activeSeats.slice(0, 4) : ["P1", "P2"]
  const currentSeat = isLudoSeat(state.currentSeat) && seats.includes(state.currentSeat)
    ? state.currentSeat
    : seats[0]!
  const diceValue = typeof state.diceValue === "number" && Number.isInteger(state.diceValue)
    ? Math.min(Math.max(state.diceValue, 1), 6)
    : null
  const lastMove = asJsonObject(state.lastMove)

  return {
    activeSeats: seats,
    currentSeat,
    tokens: Array.isArray(state.tokens)
      ? state.tokens.map(parseToken).filter((token): token is LudoToken => Boolean(token))
      : createLudoState(seats.length).tokens,
    diceValue,
    phase: state.phase === "move" && diceValue ? "move" : "roll",
    turnNumber: typeof state.turnNumber === "number" ? Math.max(1, Math.trunc(state.turnNumber)) : 1,
    targetTokens: typeof state.targetTokens === "number"
      ? Math.min(Math.max(Math.trunc(state.targetTokens), 1), LUDO_TOKENS_PER_PLAYER)
      : LUDO_TOKENS_PER_PLAYER,
    winner: isLudoSeat(state.winner) ? state.winner : null,
    lastMove: isLudoSeat(lastMove.seat) && typeof lastMove.action === "string"
      ? {
          action: lastMove.action === "move" || lastMove.action === "skip" ? lastMove.action : "roll",
          seat: lastMove.seat,
          diceValue: typeof lastMove.diceValue === "number" ? lastMove.diceValue : undefined,
          tokenId: typeof lastMove.tokenId === "string" ? lastMove.tokenId : undefined,
          capturedTokenIds: Array.isArray(lastMove.capturedTokenIds)
            ? lastMove.capturedTokenIds.filter((id): id is string => typeof id === "string")
            : undefined,
          finished: lastMove.finished === true,
        }
      : null,
  }
}

export function ludoStateToJson(state: LudoState): JsonObject {
  return state as unknown as JsonObject
}

function getNextLudoSeat(state: Pick<LudoState, "activeSeats" | "currentSeat">, fromSeat = state.currentSeat): LudoSeat {
  const currentIndex = state.activeSeats.indexOf(fromSeat)
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % state.activeSeats.length
  return state.activeSeats[nextIndex] ?? state.activeSeats[0] ?? "P1"
}

function getGlobalIndexForProgress(seat: LudoSeat, progress: number): number | null {
  if (progress < 0 || progress >= LUDO_HOME_ENTRY_PROGRESS) return null
  return (LUDO_SEAT_META[seat].startIndex + progress) % LUDO_PATH_COORDINATES.length
}

export function getLudoTokenCoordinate(token: LudoToken): readonly [number, number] {
  if (token.progress < 0) {
    return LUDO_YARD_COORDINATES[token.seat][token.index] ?? LUDO_YARD_COORDINATES[token.seat][0]!
  }

  if (token.progress >= LUDO_FINISH_PROGRESS) return [7, 7]

  if (token.progress >= LUDO_HOME_ENTRY_PROGRESS) {
    const homeIndex = token.progress - LUDO_HOME_ENTRY_PROGRESS
    return LUDO_HOME_PATH_COORDINATES[token.seat][homeIndex] ?? [7, 7]
  }

  const globalIndex = getGlobalIndexForProgress(token.seat, token.progress) ?? 0
  return LUDO_PATH_COORDINATES[globalIndex]!
}

function isLegalLudoMove(token: LudoToken, diceValue: number): boolean {
  if (!Number.isInteger(diceValue) || diceValue < 1 || diceValue > 6) return false
  if (token.progress < 0) return diceValue === 6
  if (token.progress >= LUDO_FINISH_PROGRESS) return false
  return token.progress + diceValue <= LUDO_FINISH_PROGRESS
}

export function getLegalLudoMoves(state: LudoState, seat: LudoSeat, diceValue = state.diceValue): string[] {
  if (!diceValue || state.winner) return []
  return state.tokens
    .filter((token) => token.seat === seat && isLegalLudoMove(token, diceValue))
    .map((token) => token.id)
}

export function getFinishedLudoTokenCount(state: LudoState, seat: LudoSeat): number {
  return state.tokens.filter((token) => token.seat === seat && token.progress >= LUDO_FINISH_PROGRESS).length
}

export function applyLudoRoll(state: LudoState, seat: LudoSeat, diceValue: number): LudoState {
  const legalMoves = getLegalLudoMoves({ ...state, diceValue }, seat, diceValue)
  if (legalMoves.length === 0) {
    return {
      ...state,
      currentSeat: getNextLudoSeat(state, seat),
      diceValue: null,
      phase: "roll",
      turnNumber: state.turnNumber + 1,
      lastMove: { action: "skip", seat, diceValue },
    }
  }

  return {
    ...state,
    currentSeat: seat,
    diceValue,
    phase: "move",
    lastMove: { action: "roll", seat, diceValue },
  }
}

export function applyLudoMove(state: LudoState, seat: LudoSeat, tokenId: string): LudoState {
  if (!state.diceValue) return state
  const movingToken = state.tokens.find((token) => token.id === tokenId && token.seat === seat)
  if (!movingToken || !isLegalLudoMove(movingToken, state.diceValue)) return state

  const nextProgress = movingToken.progress < 0 ? 0 : movingToken.progress + state.diceValue
  const landedGlobalIndex = getGlobalIndexForProgress(seat, nextProgress)
  const capturedTokenIds: string[] = []
  const tokens = state.tokens.map((token) => {
    if (token.id === tokenId) return { ...token, progress: nextProgress }
    if (
      landedGlobalIndex !== null &&
      !LUDO_SAFE_GLOBAL_INDICES.has(landedGlobalIndex) &&
      token.seat !== seat &&
      getGlobalIndexForProgress(token.seat, token.progress) === landedGlobalIndex
    ) {
      capturedTokenIds.push(token.id)
      return { ...token, progress: -1 }
    }
    return token
  })
  const movedState = { ...state, tokens }
  const finished = nextProgress >= LUDO_FINISH_PROGRESS
  const winner = getFinishedLudoTokenCount(movedState, seat) >= state.targetTokens ? seat : null
  const extraTurn = !winner && (state.diceValue === 6 || capturedTokenIds.length > 0 || finished)
  const currentSeat = winner ? seat : extraTurn ? seat : getNextLudoSeat(state, seat)

  return {
    ...movedState,
    currentSeat,
    diceValue: null,
    phase: "roll",
    turnNumber: state.turnNumber + 1,
    winner,
    lastMove: {
      action: "move",
      seat,
      diceValue: state.diceValue,
      tokenId,
      capturedTokenIds,
      finished,
    },
  }
}
