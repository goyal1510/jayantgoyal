"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { SOLUTION_WORDS, VALID_GUESSES } from "@/lib/games/words"

export type LetterState = "correct" | "present" | "absent" | "empty" | "tbd"

export interface CellData {
  letter: string
  state: LetterState
}

export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  guessDistribution: number[]
}

export const MAX_GUESSES = 6
export const WORD_LENGTH = 5

export const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["Enter", "z", "x", "c", "v", "b", "n", "m", "\u232B"],
]

export const STATE_COLORS: Record<LetterState, string> = {
  correct: "bg-emerald-500 text-white border-emerald-500",
  present: "bg-amber-500 text-white border-amber-500",
  absent: "bg-zinc-500 dark:bg-zinc-700 text-white border-zinc-500 dark:border-zinc-700",
  tbd: "border-zinc-300 dark:border-zinc-600 text-foreground",
  empty: "border-zinc-200 dark:border-zinc-700",
}

export const KEY_COLORS: Record<LetterState, string> = {
  correct: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600",
  present: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600",
  absent: "bg-zinc-400 dark:bg-zinc-700 text-white border-zinc-400 dark:border-zinc-700 hover:bg-zinc-500 dark:hover:bg-zinc-600",
  tbd: "bg-zinc-200 dark:bg-zinc-600 text-foreground hover:bg-zinc-300 dark:hover:bg-zinc-500",
  empty: "bg-zinc-200 dark:bg-zinc-600 text-foreground hover:bg-zinc-300 dark:hover:bg-zinc-500",
}

function getDailyWord(): string {
  const startDate = new Date("2024-01-01").getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayIndex = Math.floor((today.getTime() - startDate) / 86400000)
  return SOLUTION_WORDS[dayIndex % SOLUTION_WORDS.length]!
}

function getRandomWord(): string {
  return SOLUTION_WORDS[Math.floor(Math.random() * SOLUTION_WORDS.length)]!
}

function evaluateGuess(guess: string, solution: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill("absent")
  const solutionChars = solution.split("")
  const guessChars = guess.split("")
  const used = Array(WORD_LENGTH).fill(false)

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessChars[i] === solutionChars[i]) {
      result[i] = "correct"
      used[i] = true
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guessChars[i] === solutionChars[j]) {
        result[i] = "present"
        used[j] = true
        break
      }
    }
  }

  return result
}

function loadStats(): GameStats {
  if (typeof window === "undefined") {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: [0, 0, 0, 0, 0, 0],
    }
  }
  try {
    const saved = localStorage.getItem("wordle-stats")
    if (saved) return JSON.parse(saved) as GameStats
  } catch {
    // ignore localStorage errors
  }
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  }
}

function saveStats(stats: GameStats) {
  try {
    localStorage.setItem("wordle-stats", JSON.stringify(stats))
  } catch {
    // ignore localStorage errors
  }
}

export function useWordle() {
  const [mode, setMode] = useState<"daily" | "random" | null>(null)
  const [solution, setSolution] = useState("")
  const [guesses, setGuesses] = useState<CellData[][]>([])
  const [currentGuess, setCurrentGuess] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [shakeRow, setShakeRow] = useState(-1)
  const [revealingRow, setRevealingRow] = useState(-1)
  const [stats, setStats] = useState<GameStats>(loadStats)
  const [showStats, setShowStats] = useState(false)

  const keyboardState = useCallback(() => {
    const map: Record<string, LetterState> = {}
    for (const row of guesses) {
      for (const cell of row) {
        if (!cell.letter) continue
        const key = cell.letter.toLowerCase()
        const current = map[key]
        if (cell.state === "correct") {
          map[key] = "correct"
        } else if (cell.state === "present" && current !== "correct") {
          map[key] = "present"
        } else if (cell.state === "absent" && !current) {
          map[key] = "absent"
        }
      }
    }
    return map
  }, [guesses])

  const startGame = (gameMode: "daily" | "random") => {
    setMode(gameMode)
    setSolution(gameMode === "daily" ? getDailyWord() : getRandomWord())
    setGuesses([])
    setCurrentGuess("")
    setGameOver(false)
    setWon(false)
    setShakeRow(-1)
    setRevealingRow(-1)
    setShowStats(false)
  }

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH || gameOver || revealingRow >= 0) return

    if (!VALID_GUESSES.has(currentGuess.toLowerCase())) {
      setShakeRow(guesses.length)
      toast.error("Not in word list")
      setTimeout(() => setShakeRow(-1), 600)
      return
    }

    const states = evaluateGuess(currentGuess.toLowerCase(), solution)
    const newRow: CellData[] = currentGuess.split("").map((letter, i) => ({
      letter,
      state: states[i]!,
    }))

    setRevealingRow(guesses.length)

    setTimeout(() => {
      const newGuesses = [...guesses, newRow]
      setGuesses(newGuesses)
      setCurrentGuess("")
      setRevealingRow(-1)

      const isWin = states.every((s) => s === "correct")
      const isLoss = !isWin && newGuesses.length >= MAX_GUESSES

      if (isWin || isLoss) {
        setGameOver(true)
        setWon(isWin)

        const updatedStats = { ...loadStats() }
        updatedStats.gamesPlayed++
        if (isWin) {
          updatedStats.gamesWon++
          updatedStats.currentStreak++
          updatedStats.maxStreak = Math.max(updatedStats.maxStreak, updatedStats.currentStreak)
          updatedStats.guessDistribution[newGuesses.length - 1]!++
        } else {
          updatedStats.currentStreak = 0
        }
        saveStats(updatedStats)
        setStats(updatedStats)

        setTimeout(() => {
          if (isWin) {
            toast.success(`You got it in ${newGuesses.length}!`)
          } else {
            toast.error(`The word was "${solution.toUpperCase()}"`)
          }
          setShowStats(true)
        }, 300)
      }
    }, WORD_LENGTH * 150)
  }, [currentGuess, gameOver, guesses, revealingRow, solution])

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver || revealingRow >= 0) return

      if (key === "Enter") {
        submitGuess()
      } else if (key === "Backspace" || key === "\u232B") {
        setCurrentGuess((prev) => prev.slice(0, -1))
      } else if (/^[a-zA-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key.toLowerCase())
      }
    },
    [currentGuess, gameOver, revealingRow, submitGuess]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      handleKey(e.key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleKey])

  const gridRows: CellData[][] = []
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      gridRows.push(guesses[i]!)
    } else if (i === guesses.length) {
      const row: CellData[] = []
      for (let j = 0; j < WORD_LENGTH; j++) {
        row.push({
          letter: currentGuess[j] ?? "",
          state: currentGuess[j] ? "tbd" : "empty",
        })
      }
      gridRows.push(row)
    } else {
      gridRows.push(
        Array(WORD_LENGTH)
          .fill(null)
          .map(() => ({ letter: "", state: "empty" as LetterState }))
      )
    }
  }

  const kbState = keyboardState()

  return {
    mode,
    guesses,
    gameOver,
    won,
    shakeRow,
    revealingRow,
    stats,
    showStats,
    setShowStats,
    gridRows,
    kbState,
    startGame,
    handleKey,
  }
}
