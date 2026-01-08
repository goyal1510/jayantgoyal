"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Loader2,
  RefreshCcw,
  Settings,
  Square,
  User,
  UserCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { playToastSound } from "@/lib/sound"
import { cn } from "@/lib/utils"

type Mode = "local_pvp" | "vs_computer"
type Cell = "X" | "O" | ""
type WinnerResult = "X" | "O" | null

type Move = {
  id: string
  playerName: string
  symbol: "X" | "O"
  cell: number
  at: string
}

const winPatterns: ReadonlyArray<[number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const

const DEFAULT_NAMES = {
  O: "Player O",
  X: "Player X",
}

export function TicTacToe() {
  const [mode, setMode] = useState<Mode>("vs_computer")
  const [board, setBoard] = useState<Cell[]>(Array<Cell>(9).fill(""))
  const [turnO, setTurnO] = useState(true)
  const [winner, setWinner] = useState<WinnerResult>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSetupSheet, setShowSetupSheet] = useState(true)
  const [playerO, setPlayerO] = useState("You (O)")
  const [playerX, setPlayerX] = useState("Computer (X)")
  const [moveHistory, setMoveHistory] = useState<Move[]>([])

  const playerLabels = useMemo(() => {
    return {
      current: turnO ? playerO : playerX,
      modeLabel: mode === "vs_computer" ? "You vs Computer" : "Local PvP",
    }
  }, [turnO, mode, playerO, playerX])

  const announceOutcome = (outcome: WinnerResult | "draw") => {
    if (outcome === "draw") {
      void playToastSound()
      return
    }
    if (!outcome) return
    void playToastSound()
  }

  const resetBoard = () => {
    setBoard(Array<Cell>(9).fill(""))
    setTurnO(true)
    setWinner(null)
    setIsDraw(false)
    setMoveHistory([])
    setShowSetupSheet(true);
  }

  const startSession = (nextMode: Mode) => {
    setMode(nextMode)
    resetBoard()
    setShowSetupSheet(false)
    if (nextMode === "vs_computer") {
      setPlayerO("You (O)")
      setPlayerX("Computer (X)")
    } else {
      setPlayerO(DEFAULT_NAMES.O)
      setPlayerX(DEFAULT_NAMES.X)
    }
  }

  useEffect(() => {
    // open setup on first render
    setShowSetupSheet(true)
  }, [])

  const addMove = (cell: number, symbol: "X" | "O", name: string) => {
    setMoveHistory((prev) => [
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        playerName: name,
        symbol,
        cell,
        at: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  const handleBoxClick = async (index: number) => {
    if (board[index] || winner || isDraw || isLoading) return
    const symbol = turnO ? "O" : "X"
    const name = symbol === "O" ? playerO : playerX
    const updatedBoard = [...board]
    updatedBoard[index] = symbol
    setBoard(updatedBoard)
    addMove(index, symbol, name)
    setTurnO(!turnO)

    const resolvedWinner = checkWinner(updatedBoard)
    if (resolvedWinner) {
      setWinner(resolvedWinner)
      announceOutcome(resolvedWinner)
    } else if (updatedBoard.every(Boolean)) {
      setIsDraw(true)
      announceOutcome("draw")
    } else if (mode === "vs_computer" && symbol === "O") {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 300))
      await handleComputerMove(updatedBoard)
      setIsLoading(false)
    }
  }

  const handleComputerMove = async (currentBoard: Cell[]) => {
    if (winner || isDraw) return
    const computerMove = getBestMove(currentBoard)
    if (computerMove === null) return

    const updatedBoard = [...currentBoard]
    updatedBoard[computerMove] = "X"
    setBoard(updatedBoard)
    addMove(computerMove, "X", playerX)
    setTurnO(true)

    const resolvedWinner = checkWinner(updatedBoard)
    if (resolvedWinner) {
      setWinner(resolvedWinner)
      announceOutcome(resolvedWinner)
    } else if (updatedBoard.every(Boolean)) {
      setIsDraw(true)
      announceOutcome("draw")
    }
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
                    "aspect-square rounded-lg border bg-background text-3xl font-semibold transition hover:bg-muted",
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

function checkWinner(current: Cell[]): WinnerResult {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern
    const first = current[a]
    if (!first) continue
    if (first === current[b] && first === current[c]) {
      return first
    }
  }
  return null
}

function getBestMove(board: Cell[]): number | null {
  const findWinningMove = (player: Cell): number | null => {
    for (const [a, b, c] of winPatterns) {
      const line = [board[a], board[b], board[c]]
      const playerCount = line.filter((cell) => cell === player).length
      const emptyIndex = [a, b, c].find((idx) => board[idx] === "")
      if (playerCount === 2 && emptyIndex !== undefined) {
        return emptyIndex
      }
    }
    return null
  }

  const winningMove = findWinningMove("X")
  if (winningMove !== null) return winningMove

  const blockingMove = findWinningMove("O")
  if (blockingMove !== null) return blockingMove

  const preferenceOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7]
  const preferred = preferenceOrder.find((idx) => board[idx] === "")
  if (preferred !== undefined) return preferred

  return null
}
