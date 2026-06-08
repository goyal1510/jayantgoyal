"use client"

import { useState } from "react"
import {
  Loader2,
  Globe2,
  RefreshCcw,
  Settings,
  Square,
  User,
  UserCheck,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/sheet"
import { cn } from "@repo/ui/lib/utils"

import { useTicTacToe } from "@/components/games/use-tic-tac-toe"
import { EMPTY_TIC_TAC_TOE_STATE } from "@/lib/games/tic-tac-toe"
import {
  GameClockCard,
  ROUND_TIME_PRESETS,
  TimeControlPicker,
  useGameCountdown,
} from "@/components/games/game-time-controls"

export function TicTacToe() {
  const router = useRouter()
  const {
    mode,
    setMode,
    board,
    winner,
    isDraw,
    isLoading,
    showSetupSheet,
    setShowSetupSheet,
    playerO,
    setPlayerO,
    playerX,
    setPlayerX,
    moveHistory,
    playerLabels,
    currentSymbol,
    resetBoard,
    startSession,
    handleBoxClick,
  } = useTicTacToe()
  const [onlineName, setOnlineName] = useState("Player X")
  const [joinCode, setJoinCode] = useState("")
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [turnSeconds, setTurnSeconds] = useState(10)
  const [timerResetKey, setTimerResetKey] = useState(0)
  const [timeoutWinner, setTimeoutWinner] = useState<"X" | "O" | null>(null)

  const isTimedGameActive = !showSetupSheet && !winner && !isDraw && !timeoutWinner
  const turnClock = useGameCountdown({
    durationSeconds: turnSeconds,
    active: isTimedGameActive,
    resetKey: `${timerResetKey}-${moveHistory.length}-${currentSymbol}`,
    onExpire: () => setTimeoutWinner(currentSymbol === "O" ? "X" : "O"),
  })

  const resetTimedBoard = () => {
    setTimeoutWinner(null)
    setTimerResetKey((current) => current + 1)
    resetBoard()
  }

  const startTimedSession = () => {
    setTimeoutWinner(null)
    setTimerResetKey((current) => current + 1)
    startSession(mode)
  }

  const createOnlineRoom = async () => {
    setCreatingRoom(true)
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "tic-tac-toe",
        displayName: onlineName,
        settings: { initialState: EMPTY_TIC_TAC_TOE_STATE },
      }),
    })
    setCreatingRoom(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to create Tic Tac Toe room")
      return
    }

    const data = await response.json()
    const roomCode = data?.session?.session?.room_code
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned")
      return
    }

    router.push(`/games/tic-tac-toe/room/${roomCode}`)
  }

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code")
      return
    }
    router.push(`/games/tic-tac-toe/room/${roomCode}`)
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tic Tac Toe</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSetupSheet(true)}
              disabled={isLoading}
            >
              <Settings className="mr-2 h-4 w-4" />
              Setup
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetTimedBoard}
              disabled={isLoading}
              aria-label="Reset board"
              title="Reset board"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <div className="space-y-3">
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                  {winner
                    ? `Winner: ${winner === "O" ? playerO : playerX}`
                    : timeoutWinner
                      ? `Winner on time: ${timeoutWinner === "O" ? playerO : playerX}`
                    : isDraw
                      ? "Game Draw"
                      : `Turn: ${playerLabels.current}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {playerLabels.modeLabel} · {playerO} (O) vs {playerX} (X)
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
              <GameClockCard
                label={`${playerLabels.current} clock`}
                helper={`Current symbol: ${currentSymbol}`}
                remainingMs={turnClock.remainingMs}
                active={isTimedGameActive}
                expired={!!timeoutWinner}
                tone={currentSymbol === "O" ? "emerald" : "blue"}
              />
              <TimeControlPicker
                label="Turn limit"
                presets={ROUND_TIME_PRESETS}
                valueSeconds={turnSeconds}
                onChange={(seconds) => {
                  setTurnSeconds(seconds)
                  setTimerResetKey((current) => current + 1)
                }}
                disabled={!showSetupSheet && moveHistory.length > 0 && !winner && !isDraw}
              />
            </div>

            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-2 max-w-xs sm:max-w-md w-full">
                {board.map((value, index) => {
                  const row = Math.floor(index / 3) + 1
                  const column = (index % 3) + 1
                  const label = value
                    ? `Cell row ${row}, column ${column}: ${value}`
                    : `Empty cell row ${row}, column ${column}`

                  return (
                    <button
                      key={index}
                      onClick={() => handleBoxClick(index)}
                      disabled={!!value || !!winner || isDraw || isLoading || !!timeoutWinner}
                      className={cn(
                        "aspect-square cursor-pointer rounded-lg border bg-background text-3xl font-semibold transition hover:bg-muted",
                        "disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center"
                      )}
                      aria-label={label}
                      title={label}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-3 h-full min-h-[360px] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="font-medium">Move history</div>
              <div className="text-xs text-muted-foreground">{moveHistory.length} move{moveHistory.length === 1 ? "" : "s"}</div>
            </div>
            {moveHistory.length === 0 ? (
              <div className="text-xs text-muted-foreground flex-1 flex items-center justify-center">
                No moves yet.
              </div>
            ) : (
              <div className="space-y-2 flex-1 max-h-[480px] overflow-y-auto pr-1 text-sm">
                {moveHistory.map((move, idx) => (
                  <div
                    key={move.id}
                    className="flex items-center justify-between rounded-md border bg-background p-2"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground">
                        Move {moveHistory.length - idx} · {new Date(move.at).toLocaleTimeString()}
                      </div>
                      <div className="font-medium">{move.playerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {move.symbol} to cell {move.cell + 1}
                      </div>
                    </div>
                    <Square className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={showSetupSheet} onOpenChange={setShowSetupSheet}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader className="pb-2">
            <SheetTitle>Setup Tic Tac Toe</SheetTitle>
            <SheetDescription>
              Choose mode and player names. Starting a new session clears the board and history.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mode</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant={mode === "local_pvp" ? "secondary" : "outline"}
                  onClick={() => setMode("local_pvp")}
                  className="justify-start"
                >
                  <User className="mr-2 h-4 w-4" />
                  Player vs Player
                </Button>
                <Button
                  variant={mode === "vs_computer" ? "secondary" : "outline"}
                  onClick={() => setMode("vs_computer")}
                  className="justify-start"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Player vs Computer
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Names</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-muted-foreground">O:</span>
                  <Input
                    value={playerO}
                    onChange={(e) => setPlayerO(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-muted-foreground">X:</span>
                  <Input
                    value={playerX}
                    onChange={(e) => setPlayerX(e.target.value)}
                    disabled={mode === "vs_computer"}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                In vs Computer mode, X is reserved for the computer.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={startTimedSession}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start game"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetTimedBoard()
                  setShowSetupSheet(false)
                }}
              >
                Cancel
              </Button>
            </div>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe2 className="h-4 w-4" />
                Online room
              </div>
              <div className="space-y-2">
                <Label htmlFor="tic-online-name">Your display name</Label>
                <Input
                  id="tic-online-name"
                  value={onlineName}
                  onChange={(event) => setOnlineName(event.target.value)}
                />
              </div>
              <Button onClick={createOnlineRoom} disabled={creatingRoom} className="w-full">
                {creatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create online room"}
              </Button>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="Room code"
                  maxLength={10}
                />
                <Button variant="outline" onClick={joinOnlineRoom}>
                  Join
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
