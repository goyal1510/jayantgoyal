"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  RefreshCcw,
  Settings,
  Circle,
  User,
  UserCheck,
  Globe2,
} from "lucide-react"
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

import { useConnectFour, ROWS, COLS } from "@/components/games/use-connect-four"
import {
  GameClockCard,
  ROUND_TIME_PRESETS,
  TimeControlPicker,
  useGameCountdown,
} from "@/components/games/game-time-controls"
import { GameSetupShell } from "@/components/games/game-setup-shell"

export function ConnectFour() {
  const router = useRouter()
  const {
    mode,
    setMode,
    board,
    currentPlayer,
    winner,
    isDraw,
    isLoading,
    showSetupSheet,
    setShowSetupSheet,
    gameStarted,
    playerR,
    setPlayerR,
    playerY,
    setPlayerY,
    lastMove,
    winningLine,
    animatingCell,
    isProcessingMove,
    playerLabels,
    resetBoard,
    startSession,
    handleColumnClick,
  } = useConnectFour()
  const [onlineName, setOnlineName] = useState("Player Red")
  const [joinCode, setJoinCode] = useState("")
  const [isCreatingOnlineRoom, setIsCreatingOnlineRoom] = useState(false)
  const [turnSeconds, setTurnSeconds] = useState(10)
  const [timerResetKey, setTimerResetKey] = useState(0)
  const [timeoutWinner, setTimeoutWinner] = useState<"R" | "Y" | null>(null)

  const isTimedGameActive =
    !showSetupSheet &&
    gameStarted &&
    !winner &&
    !isDraw &&
    !timeoutWinner &&
    !isLoading &&
    !isProcessingMove
  const turnClock = useGameCountdown({
    durationSeconds: turnSeconds,
    active: isTimedGameActive,
    resetKey: `${timerResetKey}-${currentPlayer}-${lastMove?.row ?? "start"}-${lastMove?.col ?? "start"}`,
    onExpire: () => setTimeoutWinner(currentPlayer === "R" ? "Y" : "R"),
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
    setIsCreatingOnlineRoom(true)
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "connect-four",
        displayName: onlineName,
      }),
    })
    setIsCreatingOnlineRoom(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to create online room")
      return
    }

    const data = await response.json()
    const roomCode = data?.session?.session?.room_code
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned")
      return
    }

    router.push(`/games/connect-four/room/${roomCode}`)
  }

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code")
      return
    }
    router.push(`/games/connect-four/room/${roomCode}`)
  }

  if (!gameStarted) {
    return (
      <GameSetupShell
        title="Connect Four"
        description="Choose players, mode, and the per-turn clock before the first disc can drop."
        onStart={startTimedSession}
        disabled={isLoading}
      >
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="connect-player-r">Red player</Label>
            <Input
              id="connect-player-r"
              name="connect-player-r"
              value={playerR}
              onChange={(event) => setPlayerR(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="connect-player-y">Yellow player</Label>
            <Input
              id="connect-player-y"
              name="connect-player-y"
              value={playerY}
              onChange={(event) => setPlayerY(event.target.value)}
              disabled={mode === "vs_computer"}
              autoComplete="off"
            />
          </div>
        </div>

        <TimeControlPicker
          label="Turn limit"
          presets={ROUND_TIME_PRESETS}
          valueSeconds={turnSeconds}
          onChange={(seconds) => {
            setTurnSeconds(seconds)
            setTimerResetKey((current) => current + 1)
          }}
        />

        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Globe2 className="h-4 w-4" />
            Online room
          </div>
          <div className="space-y-2">
            <Label htmlFor="online-player-name">Your online display name</Label>
            <Input
              id="online-player-name"
              value={onlineName}
              onChange={(event) => setOnlineName(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={createOnlineRoom}
            disabled={isCreatingOnlineRoom}
            className="w-full"
          >
            {isCreatingOnlineRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create online room"}
          </Button>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={10}
            />
            <Button type="button" variant="outline" onClick={joinOnlineRoom}>
              Join
            </Button>
          </div>
        </div>
      </GameSetupShell>
    )
  }

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Connect Four</CardTitle>
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
        <CardContent className="space-y-4">
          <div className={cn(
            "rounded-lg border p-3 transition-colors",
            winner ? "bg-green-100 dark:bg-green-900/20 border-green-400" : "bg-muted/20"
          )}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={cn(
                "text-sm font-semibold",
                winner && "text-green-700 dark:text-green-400"
              )}>
                {winner
                  ? `\uD83C\uDF89 Winner: ${winner === "R" ? playerR : playerY} \uD83C\uDF89`
                  : timeoutWinner
                    ? `Winner on time: ${timeoutWinner === "R" ? playerR : playerY}`
                  : isDraw
                    ? "Game Draw"
                    : `Turn: ${playerLabels.current}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {playerLabels.modeLabel} · {playerR} (Red) vs {playerY} (Yellow)
                {winningLine.length > 0 && ` · ${winningLine.length} winning cells`}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
            <GameClockCard
              label={`${playerLabels.current} clock`}
              helper={currentPlayer === "R" ? "Red to move" : "Yellow to move"}
              remainingMs={turnClock.remainingMs}
              active={isTimedGameActive}
              expired={!!timeoutWinner}
              tone={currentPlayer === "R" ? "rose" : "amber"}
            />
            <TimeControlPicker
              label="Turn limit"
              presets={ROUND_TIME_PRESETS}
              valueSeconds={turnSeconds}
              onChange={(seconds) => {
                setTurnSeconds(seconds)
                setTimerResetKey((current) => current + 1)
              }}
                disabled
            />
          </div>

          <div className="flex justify-center">
            <div className="inline-block border-4 border-blue-500 rounded-lg p-2 bg-blue-100 dark:bg-blue-900/20">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: COLS }).map((_, col) => (
                  <div key={col} className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full mb-1"
                      onClick={() => handleColumnClick(col)}
                      disabled={
                        !!winner ||
                        !!isDraw ||
                        !!timeoutWinner ||
                        !gameStarted ||
                        isLoading ||
                        isProcessingMove ||
                        (mode === "vs_computer" && currentPlayer === "Y")
                      }
                      aria-label={`Drop disc in column ${col + 1}`}
                      title={`Drop disc in column ${col + 1}`}
                    >
                      \u2193
                    </Button>
                    <div className="relative">
                      {Array.from({ length: ROWS }).map((_, row) => {
                        const cell = board[row]![col]!
                        const isLastMove = lastMove?.row === row && lastMove?.col === col
                        const isWinning = winningLine.some((w) => w.row === row && w.col === col)
                        return (
                          <div
                            key={`${row}-${col}`}
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all relative",
                              cell === "R" && "bg-red-500 border-red-600",
                              cell === "Y" && "bg-yellow-400 border-yellow-500",
                              cell === "" && "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                              isLastMove && "ring-4 ring-blue-400 ring-offset-2",
                              isWinning && "ring-4 ring-green-400 ring-offset-2 animate-pulse"
                            )}
                          >
                            {cell === "R" && <Circle className="h-6 w-6 sm:h-8 sm:w-8 text-red-700" fill="currentColor" />}
                            {cell === "Y" && <Circle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" fill="currentColor" />}
                          </div>
                        )
                      })}
                      {animatingCell && animatingCell.col === col && (
                        <div
                          className={cn(
                            "absolute left-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center z-10",
                            currentPlayer === "R" && "bg-red-500 border-red-600",
                            currentPlayer === "Y" && "bg-yellow-400 border-yellow-500",
                            "coin-drop-animation"
                          )}
                          style={{
                            top: `calc(${animatingCell.row} * (100% / ${ROWS}))`,
                          }}
                        >
                          <Circle
                            className={cn(
                              "h-6 w-6 sm:h-8 sm:w-8",
                              currentPlayer === "R" ? "text-red-700" : "text-yellow-600"
                            )}
                            fill="currentColor"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Computer is thinking...
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={showSetupSheet} onOpenChange={setShowSetupSheet}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader className="pb-2">
            <SheetTitle>Setup Connect Four</SheetTitle>
            <SheetDescription>
              Choose mode and player names. Starting a new session clears the board.
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

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe2 className="h-4 w-4" />
                Online room
              </div>
              <div className="space-y-2">
                <Label htmlFor="online-player-name" className="text-xs text-muted-foreground">
                  Your online display name
                </Label>
                <Input
                  id="online-player-name"
                  value={onlineName}
                  onChange={(event) => setOnlineName(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={createOnlineRoom}
                disabled={isCreatingOnlineRoom}
                className="w-full"
              >
                {isCreatingOnlineRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create online room"}
              </Button>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="Room code"
                  maxLength={10}
                />
                <Button type="button" variant="outline" onClick={joinOnlineRoom}>
                  Join
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Online rooms open a shareable link for another signed-in player.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Names</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-muted-foreground">Red:</span>
                  <Input
                    value={playerR}
                    onChange={(e) => setPlayerR(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-muted-foreground">Yellow:</span>
                  <Input
                    value={playerY}
                    onChange={(e) => setPlayerY(e.target.value)}
                    disabled={mode === "vs_computer"}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                In vs Computer mode, Yellow is reserved for the computer. You play as Red.
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
