"use client"

import { useState } from "react"
import { RotateCcw, BarChart3, Loader2, Wifi } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"

import { GameSetupShell } from "@/components/games/game-setup-shell"
import {
  useWordle,
  KEYBOARD_ROWS,
  STATE_COLORS,
  KEY_COLORS,
} from "@/components/games/use-wordle"
import { createWordleState } from "@/lib/games/wordle"

export function Wordle() {
  const router = useRouter()
  const {
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
  } = useWordle()
  const [selectedMode, setSelectedMode] = useState<"daily" | "random">("daily")
  const [onlineRoomCode, setOnlineRoomCode] = useState("")
  const [creatingOnlineRoom, setCreatingOnlineRoom] = useState(false)
  const [joiningOnlineRoom, setJoiningOnlineRoom] = useState(false)

  const createOnlineRoom = async () => {
    setCreatingOnlineRoom(true)
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "wordle",
        displayName: "Wordle P1",
        settings: {
          initialState: createWordleState(),
        },
      }),
    })
    setCreatingOnlineRoom(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to create online room")
      return
    }

    const data = await response.json()
    const roomCode = data.session?.session?.room_code
    if (typeof roomCode === "string") {
      router.push(`/games/wordle/room/${roomCode}`)
    }
  }

  const joinOnlineRoom = () => {
    const normalized = onlineRoomCode.trim().toUpperCase()
    if (!normalized) {
      toast.error("Enter a room code")
      return
    }

    setJoiningOnlineRoom(true)
    router.push(`/games/wordle/room/${normalized}`)
  }

  if (!mode) {
    return (
      <GameSetupShell
        title="Wordle"
        description="Choose daily or random mode before the keyboard becomes active."
        onStart={() => startGame(selectedMode)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            size="lg"
            variant={selectedMode === "daily" ? "secondary" : "outline"}
            onClick={() => setSelectedMode("daily")}
            className="w-full"
          >
            Daily Challenge
          </Button>
          <Button
            type="button"
            size="lg"
            variant={selectedMode === "random" ? "secondary" : "outline"}
            onClick={() => setSelectedMode("random")}
            className="w-full"
          >
            Random Word
          </Button>
        </div>
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4" />
              Online room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => void createOnlineRoom()}
              disabled={creatingOnlineRoom}
              className="w-full"
            >
              {creatingOnlineRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create online challenge"}
            </Button>
            <div className="flex gap-2">
              <Input
                value={onlineRoomCode}
                onChange={(event) => setOnlineRoomCode(event.target.value)}
                placeholder="Room code"
                className="uppercase"
              />
              <Button
                type="button"
                variant="outline"
                onClick={joinOnlineRoom}
                disabled={joiningOnlineRoom}
              >
                {joiningOnlineRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </Button>
            </div>
          </CardContent>
        </Card>
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
      </GameSetupShell>
    )
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
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

      <div className="mt-2 flex w-full flex-col items-center gap-1.5">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1 sm:gap-1.5">
            {row.map((key) => {
              const isSpecial = key === "Enter" || key === "\u232B"
              const state = isSpecial ? "empty" : (kbState[key] ?? "empty")
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key === "\u232B" ? "Backspace" : key)}
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
