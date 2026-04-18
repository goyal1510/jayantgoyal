"use client"

import { useCallback, useEffect, useState } from "react"
import { RotateCcw, BarChart3 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { SOLUTION_WORDS, VALID_GUESSES } from "@/lib/games/words"

type LetterState = "correct" | "present" | "absent" | "empty" | "tbd"

interface CellData {
  letter: string
  state: LetterState
}

interface GameStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  guessDistribution: number[]
}

const MAX_GUESSES = 6
const WORD_LENGTH = 5

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["Enter", "z", "x", "c", "v", "b", "n", "m", "⌫"],
]

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

  // First pass: mark correct
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessChars[i] === solutionChars[i]) {
      result[i] = "correct"
      used[i] = true
    }
  }

  // Second pass: mark present
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

const STATE_COLORS: Record<LetterState, string> = {
  correct: "bg-emerald-500 text-white border-emerald-500",
  present: "bg-amber-500 text-white border-amber-500",
  absent: "bg-zinc-500 dark:bg-zinc-700 text-white border-zinc-500 dark:border-zinc-700",
  tbd: "border-zinc-300 dark:border-zinc-600 text-foreground",
  empty: "border-zinc-200 dark:border-zinc-700",
}

const KEY_COLORS: Record<LetterState, string> = {
  correct: "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600",
  present: "bg-amber-500 text-white border-amber-500 hover:bg-amber-600",
  absent: "bg-zinc-400 dark:bg-zinc-700 text-white border-zinc-400 dark:border-zinc-700 hover:bg-zinc-500 dark:hover:bg-zinc-600",
  tbd: "bg-zinc-200 dark:bg-zinc-600 text-foreground hover:bg-zinc-300 dark:hover:bg-zinc-500",
  empty: "bg-zinc-200 dark:bg-zinc-600 text-foreground hover:bg-zinc-300 dark:hover:bg-zinc-500",
}

export function Wordle() {
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
      } else if (key === "Backspace" || key === "⌫") {
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

  // Mode selection screen
  if (!mode) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Wordle</h1>
          <p className="mt-2 text-muted-foreground">
            Guess the 5-letter word in 6 tries
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Button size="lg" onClick={() => startGame("daily")} className="w-full">
            Daily Challenge
          </Button>
          <Button size="lg" variant="outline" onClick={() => startGame("random")} className="w-full">
            Random Word
          </Button>
        </div>
        {stats.gamesPlayed > 0 && (
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold">{stats.gamesPlayed}</div>
                  <div className="text-xs text-muted-foreground">Played</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.gamesPlayed
                      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                      : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Win %</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.maxStreak}</div>
                  <div className="text-xs text-muted-foreground">Max</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Build grid rows
  const gridRows: CellData[][] = []
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      gridRows.push(guesses[i]!)
    } else if (i === guesses.length) {
      // Current guess row
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

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <h1 className="text-xl font-bold">
          Wordle{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({mode === "daily" ? "Daily" : "Random"})
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowStats(true)}
            title="Stats"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => startGame(mode)}
            title="New game"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-1.5">
        {gridRows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`flex gap-1.5 ${shakeRow === rowIdx ? "animate-shake" : ""}`}
          >
            {row.map((cell, colIdx) => {
              const isRevealing = revealingRow === rowIdx
              const delay = isRevealing ? colIdx * 150 : 0
              const hasLetter = cell.letter !== ""
              const isCurrentRow = rowIdx === guesses.length && !gameOver

              return (
                <div
                  key={colIdx}
                  className={`flex h-14 w-14 items-center justify-center border-2 text-2xl font-bold uppercase transition-all duration-300 sm:h-16 sm:w-16 ${STATE_COLORS[cell.state]} ${hasLetter && isCurrentRow ? "scale-105" : ""}`}
                  style={{
                    transitionDelay: `${delay}ms`,
                    animationDelay: `${delay}ms`,
                  }}
                >
                  {cell.letter}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Keyboard */}
      <div className="mt-2 flex w-full flex-col items-center gap-1.5">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1 sm:gap-1.5">
            {row.map((key) => {
              const isSpecial = key === "Enter" || key === "⌫"
              const state = isSpecial ? "empty" : (kbState[key] ?? "empty")
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key === "⌫" ? "Backspace" : key)}
                  className={`flex h-12 items-center justify-center rounded-md border text-sm font-semibold uppercase transition-colors sm:h-14 ${
                    isSpecial
                      ? "bg-zinc-200 px-2.5 text-foreground hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 sm:px-4"
                      : `w-8 sm:w-10 ${KEY_COLORS[state]}`
                  }`}
                >
                  {key}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Stats overlay */}
      {showStats && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowStats(false)}
        >
          <Card
            className="mx-4 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold">{stats.gamesPlayed}</div>
                  <div className="text-xs text-muted-foreground">Played</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.gamesPlayed
                      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                      : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Win %</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.maxStreak}</div>
                  <div className="text-xs text-muted-foreground">Max</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">Guess Distribution</h3>
                {stats.guessDistribution.map((count, i) => {
                  const max = Math.max(...stats.guessDistribution, 1)
                  const pct = Math.max((count / max) * 100, 8)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 text-sm font-medium">{i + 1}</span>
                      <div
                        className={`rounded px-2 py-0.5 text-right text-xs font-semibold text-white ${
                          won && guesses.length === i + 1
                            ? "bg-emerald-500"
                            : "bg-zinc-400 dark:bg-zinc-600"
                        }`}
                        style={{ width: `${pct}%`, minWidth: "24px" }}
                      >
                        {count}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2">
                {gameOver && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setShowStats(false)
                      startGame(mode)
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {mode === "daily" ? "Play Random" : "New Game"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowStats(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
