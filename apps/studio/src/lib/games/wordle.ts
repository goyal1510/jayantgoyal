import { asJsonObject, type JsonObject } from "@/lib/games/online-sessions"
import { VALID_GUESSES } from "@/lib/games/words"

export type WordleSeat = "P1" | "P2"
export type WordleLetterState = "correct" | "present" | "absent" | "empty" | "tbd"

export type WordleGuess = {
  word: string
  states: WordleLetterState[]
}

export type WordlePlayerState = {
  guesses: WordleGuess[]
  won: boolean
  done: boolean
}

export type WordleState = {
  players: Record<WordleSeat, WordlePlayerState>
  winner: WordleSeat | null
  isDraw: boolean
  lastGuess: {
    seat: WordleSeat
    word: string
    won: boolean
  } | null
  maxGuesses: number
}

export const WORDLE_WORD_LENGTH = 5
export const WORDLE_MAX_GUESSES = 6

export const DEFAULT_WORDLE_PLAYER_STATE: WordlePlayerState = {
  guesses: [],
  won: false,
  done: false,
}

export const DEFAULT_WORDLE_STATE: WordleState = {
  players: {
    P1: DEFAULT_WORDLE_PLAYER_STATE,
    P2: DEFAULT_WORDLE_PLAYER_STATE,
  },
  winner: null,
  isDraw: false,
  lastGuess: null,
  maxGuesses: WORDLE_MAX_GUESSES,
}

export function createWordleState(): WordleState {
  return {
    ...DEFAULT_WORDLE_STATE,
    players: {
      P1: { ...DEFAULT_WORDLE_PLAYER_STATE, guesses: [] },
      P2: { ...DEFAULT_WORDLE_PLAYER_STATE, guesses: [] },
    },
  }
}

export function normalizeWordleGuess(value: unknown): string | null {
  if (typeof value !== "string") return null
  const guess = value.trim().toLowerCase()
  if (!/^[a-z]{5}$/.test(guess) || !VALID_GUESSES.has(guess)) return null
  return guess
}

export function evaluateWordleGuess(guess: string, solution: string): WordleLetterState[] {
  const result: WordleLetterState[] = Array(WORDLE_WORD_LENGTH).fill("absent")
  const solutionChars = solution.split("")
  const guessChars = guess.split("")
  const used = Array(WORDLE_WORD_LENGTH).fill(false)

  for (let index = 0; index < WORDLE_WORD_LENGTH; index++) {
    if (guessChars[index] === solutionChars[index]) {
      result[index] = "correct"
      used[index] = true
    }
  }

  for (let index = 0; index < WORDLE_WORD_LENGTH; index++) {
    if (result[index] === "correct") continue
    for (let solutionIndex = 0; solutionIndex < WORDLE_WORD_LENGTH; solutionIndex++) {
      if (!used[solutionIndex] && guessChars[index] === solutionChars[solutionIndex]) {
        result[index] = "present"
        used[solutionIndex] = true
        break
      }
    }
  }

  return result
}

function parseGuess(value: unknown): WordleGuess | null {
  const guess = asJsonObject(value)
  if (typeof guess.word !== "string" || !/^[a-z]{5}$/.test(guess.word)) return null

  return {
    word: guess.word,
    states: Array.isArray(guess.states)
      ? guess.states.map((state) => {
          return state === "correct" || state === "present" || state === "absent"
            ? state
            : "absent"
        })
      : Array(WORDLE_WORD_LENGTH).fill("absent"),
  }
}

function parsePlayerState(value: unknown): WordlePlayerState {
  const player = asJsonObject(value)
  return {
    guesses: Array.isArray(player.guesses)
      ? player.guesses.map(parseGuess).filter((guess): guess is WordleGuess => Boolean(guess))
      : [],
    won: player.won === true,
    done: player.done === true,
  }
}

export function parseWordleState(value: unknown): WordleState {
  const state = asJsonObject(value)
  const players = asJsonObject(state.players)
  const lastGuess = asJsonObject(state.lastGuess)
  const lastGuessSeat = lastGuess.seat === "P2" ? "P2" : lastGuess.seat === "P1" ? "P1" : null

  return {
    players: {
      P1: parsePlayerState(players.P1),
      P2: parsePlayerState(players.P2),
    },
    winner: state.winner === "P1" || state.winner === "P2" ? state.winner : null,
    isDraw: state.isDraw === true,
    lastGuess: lastGuessSeat && typeof lastGuess.word === "string"
      ? {
          seat: lastGuessSeat,
          word: lastGuess.word,
          won: lastGuess.won === true,
        }
      : null,
    maxGuesses: typeof state.maxGuesses === "number" ? state.maxGuesses : WORDLE_MAX_GUESSES,
  }
}

export function wordleStateToJson(state: WordleState): JsonObject {
  return state as unknown as JsonObject
}
