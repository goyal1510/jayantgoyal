"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCcw, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { playToastSound } from "@/lib/sound"

type Mode = "local_pvp" | "vs_computer"
type Cell = "X" | "O" | ""
type WinnerResult = "X" | "O" | null

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

export function TicTacToe() {
  const [mode, setMode] = useState<Mode>("local_pvp")
  const [board, setBoard] = useState<Cell[]>(Array<Cell>(9).fill(""))
  const [turnO, setTurnO] = useState(true)
  const [winner, setWinner] = useState<WinnerResult>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const announceOutcome = (outcome: WinnerResult | "draw") => {
    if (outcome === "draw") {
      toast("Draw", { description: "Board is full. Nobody wins this round." })
      void playToastSound()
      return
    }
    if (!outcome) return
    const playerLabel =
      mode === "vs_computer"
        ? outcome === "O"
          ? "You win!"
          : "Computer wins."
        : outcome === "O"
          ? "Player O wins!"
          : "Player X wins!"
    toast.success(playerLabel)
    void playToastSound()
  }

  const playerLabels = useMemo(() => {
    return {
      current: turnO ? "Player O" : "Player X",
      modeLabel: mode === "vs_computer" ? "You vs Computer" : "Local PvP",
    }
  }, [turnO, mode])

  const createSession = async (selectedMode: Mode) => {
    setIsLoading(true)
    setBoard(Array<Cell>(9).fill(""))
    setTurnO(true)
    setWinner(null)
    setIsDraw(false)
    setIsLoading(false)
  }

  useEffect(() => {
    void createSession(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleBoxClick = async (index: number) => {
    if (board[index] || winner || isDraw || isLoading) return

    const symbol = turnO ? "O" : "X"
    const shouldComputerMove = mode === "vs_computer" && symbol === "O"
    const updatedBoard = [...board]
    updatedBoard[index] = symbol
    setBoard(updatedBoard)
    setTurnO(!turnO)

    const resolvedWinner = checkWinner(updatedBoard)
    if (resolvedWinner) {
      setWinner(resolvedWinner)
      announceOutcome(resolvedWinner)
    } else if (updatedBoard.every(Boolean)) {
      setIsDraw(true)
      announceOutcome("draw")
    } else if (shouldComputerMove) {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 300))
      await handleComputerMove(updatedBoard)
      setIsLoading(false)
    }
  }

  const handleComputerMove = async (currentBoard: Cell[]) => {
    // Simple random empty slot pick.
    const emptyIndices = currentBoard
      .map((value, idx) => ({ value, idx }))
      .filter((cell) => !cell.value)
      .map((cell) => cell.idx)

    const computerMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)]
    if (computerMove === undefined || winner || isDraw) return

    const updatedBoard = [...currentBoard]
    updatedBoard[computerMove] = "X"
    setBoard(updatedBoard)
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

  const resetBoard = () => {
    setBoard(Array<Cell>(9).fill(""))
    setTurnO(true)
    setWinner(null)
    setIsDraw(false)
  }

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tic Tac Toe</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode(mode === "local_pvp" ? "vs_computer" : "local_pvp")}
            disabled={isLoading}
          >
            Mode: {mode === "vs_computer" ? "vs Computer" : "Local PvP"}
          </Button>
          <Button variant="ghost" size="icon" onClick={resetBoard} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => void createSession(mode)} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {winner ? `Winner: ${winner}` : isDraw ? "Game Draw" : `Turn: ${playerLabels.current}`}
            </span>
            <span className="text-muted-foreground">{playerLabels.modeLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 max-w-md">
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

        <div className="text-xs text-muted-foreground">
          Local play only; nothing is saved once you leave.
        </div>
      </CardContent>
    </Card>
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
