"use client"

import {
  Loader2,
  RefreshCcw,
  Settings,
  Square,
  User,
  UserCheck,
} from "lucide-react"

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

export function TicTacToe() {
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
    resetBoard,
    startSession,
    handleBoxClick,
  } = useTicTacToe()

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
            <Button variant="ghost" size="icon" onClick={resetBoard} disabled={isLoading}>
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
                    : isDraw
                      ? "Game Draw"
                      : `Turn: ${playerLabels.current}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {playerLabels.modeLabel} · {playerO} (O) vs {playerX} (X)
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-2 max-w-xs sm:max-w-md w-full">
              {board.map((value, index) => (
                <button
                  key={index}
                  onClick={() => handleBoxClick(index)}
                  disabled={!!value || !!winner || isDraw || isLoading}
                  className={cn(
                    "aspect-square cursor-pointer rounded-lg border bg-background text-3xl font-semibold transition hover:bg-muted",
                    "disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center"
                  )}
                >
                  {value}
                </button>
              ))}
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
                onClick={() => startSession(mode)}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start game"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetBoard()
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
