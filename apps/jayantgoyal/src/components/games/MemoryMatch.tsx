"use client"

import {
  Loader2,
  RefreshCcw,
  Settings,
  User,
  UserCheck,
  Trophy,
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

import { useMemoryMatch, GRID_SIZES } from "@/components/games/use-memory-match"

export function MemoryMatch() {
  const {
    mode,
    setMode,
    gridSize,
    setGridSize,
    cards,
    flippedCards,
    currentPlayer,
    scores,
    isLoading,
    showSetupSheet,
    setShowSetupSheet,
    player1Name,
    setPlayer1Name,
    player2Name,
    setPlayer2Name,
    gameStarted,
    moves,
    playerLabels,
    gameOver,
    winner,
    resetGame,
    startSession,
    handleCardClick,
  } = useMemoryMatch()

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Memory Match</CardTitle>
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
            <Button variant="ghost" size="icon" onClick={resetGame} disabled={isLoading}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">
                {gameOver
                  ? winner
                    ? `Winner: ${winner === 1 ? player1Name : player2Name}`
                    : "It's a tie!"
                  : `Turn: ${playerLabels.current}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {playerLabels.modeLabel} · Moves: {moves}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border bg-background p-3 text-center">
              <div className="text-xs text-muted-foreground">{player1Name}</div>
              <div className="text-xl font-semibold">{scores.player1}</div>
            </div>
            <div className="rounded-lg border bg-background p-3 text-center">
              <div className="text-xs text-muted-foreground">{player2Name}</div>
              <div className="text-xl font-semibold">{scores.player2}</div>
            </div>
          </div>

          {gameStarted && (
            <div className="flex justify-center">
              <div
                className={cn(
                  "grid gap-2",
                  gridSize === 0 && "grid-cols-3",
                  gridSize === 1 && "grid-cols-4",
                  gridSize === 2 && "grid-cols-4"
                )}
              >
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    disabled={
                      isLoading ||
                      card.flipped ||
                      card.matched ||
                      flippedCards.length >= 2 ||
                      (mode === "vs_computer" && currentPlayer === 2) ||
                      gameOver
                    }
                    className={cn(
                      "aspect-square w-16 h-16 sm:w-20 sm:h-20 cursor-pointer rounded-lg border-2 transition-all",
                      "disabled:cursor-not-allowed",
                      card.matched
                        ? "bg-green-200 dark:bg-green-900/30 border-green-400"
                        : card.flipped
                          ? "bg-blue-100 dark:bg-blue-900/30 border-blue-400"
                          : "bg-slate-200 dark:bg-slate-700 border-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600",
                      card.flipped && "ring-2 ring-blue-400"
                    )}
                  >
                    {card.flipped || card.matched ? (
                      <div className="flex items-center justify-center h-full text-2xl font-bold">
                        {card.value}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        ?
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!gameStarted && (
            <div className="text-center py-8 text-muted-foreground">
              Click Setup to start a new game
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "vs_computer" && currentPlayer === 2
                ? "Computer is thinking..."
                : "Processing..."}
            </div>
          )}

          {gameOver && (
            <div className="rounded-lg border bg-green-100 dark:bg-green-900/20 p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="font-semibold text-lg">
                {winner ? `${winner === 1 ? player1Name : player2Name} wins!` : "It's a tie!"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Completed in {moves} moves
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={showSetupSheet} onOpenChange={setShowSetupSheet}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader className="pb-2">
            <SheetTitle>Setup Memory Match</SheetTitle>
            <SheetDescription>
              Choose mode, difficulty, and player names. Find matching pairs of cards!
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

            <div className="space-y-2">
              <Label className="text-sm font-medium">Difficulty</Label>
              <div className="grid gap-2">
                {GRID_SIZES.map((size, index) => (
                  <Button
                    key={index}
                    variant={gridSize === index ? "secondary" : "outline"}
                    onClick={() => setGridSize(index)}
                    className="justify-start"
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Names</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-muted-foreground">Player 1:</span>
                  <Input
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-muted-foreground">Player 2:</span>
                  <Input
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    disabled={mode === "vs_computer"}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                In vs Computer mode, Player 2 is the computer.
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
                  resetGame()
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
