"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Loader2,
  RefreshCcw,
  Settings,
  Circle,
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
import { playToastSound } from "@/lib/sound"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Mode = "local_pvp" | "vs_computer"
type Cell = "R" | "Y" | "" // Red or Yellow
type WinnerResult = "R" | "Y" | null

const ROWS = 6
const COLS = 7
const WIN_LENGTH = 4

const DEFAULT_NAMES = {
  R: "Player Red",
  Y: "Player Yellow",
}

export function ConnectFour() {
  const [mode, setMode] = useState<Mode>("vs_computer")
  const [board, setBoard] = useState<Cell[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill("") as Cell[])
  )
  const [currentPlayer, setCurrentPlayer] = useState<"R" | "Y">("R")
  const [winner, setWinner] = useState<WinnerResult>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSetupSheet, setShowSetupSheet] = useState(true)
  const [playerR, setPlayerR] = useState("You (Red)")
  const [playerY, setPlayerY] = useState("Computer (Yellow)")
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null)
  const [winningLine, setWinningLine] = useState<Array<{ row: number; col: number }>>([])
  const [animatingCell, setAnimatingCell] = useState<{ row: number; col: number } | null>(null)
  const [isProcessingMove, setIsProcessingMove] = useState(false)

  const playerLabels = useMemo(() => {
    return {
      current: currentPlayer === "R" ? playerR : playerY,
      modeLabel: mode === "vs_computer" ? "You vs Computer" : "Local PvP",
    }
  }, [currentPlayer, mode, playerR, playerY])

  const announceOutcome = (outcome: WinnerResult | "draw") => {
    if (outcome === "draw") {
      void playToastSound()
      return
    }
    if (!outcome) return
    void playToastSound()
  }

  const resetBoard = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill("") as Cell[]))
    setCurrentPlayer("R") // Red always starts
    setWinner(null)
    setIsDraw(false)
    setLastMove(null)
    setWinningLine([])
    setAnimatingCell(null)
    setIsProcessingMove(false)
    setShowSetupSheet(true)
  }

  const startSession = (nextMode: Mode) => {
    setMode(nextMode)
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill("") as Cell[])
    setBoard(newBoard)
    setCurrentPlayer("R") // Red always starts
    setWinner(null)
    setIsDraw(false)
    setLastMove(null)
    setWinningLine([])
    setAnimatingCell(null)
    setIsProcessingMove(false)
    setShowSetupSheet(false)
    if (nextMode === "vs_computer") {
      setPlayerR("You (Red)")
      setPlayerY("Computer (Yellow)")
    } else {
      setPlayerR(DEFAULT_NAMES.R)
      setPlayerY(DEFAULT_NAMES.Y)
    }
  }

  useEffect(() => {
    setShowSetupSheet(true)
  }, [])

  const getAvailableRow = (col: number, boardState?: Cell[][]): number | null => {
    const boardToCheck = boardState || board
    for (let row = ROWS - 1; row >= 0; row--) {
      if (boardToCheck[row]![col] === "") {
        return row
      }
    }
    return null
  }

  const checkWinner = (board: Cell[][], row: number, col: number, player: "R" | "Y"): Array<{ row: number; col: number }> | null => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal \
      [1, -1],  // diagonal /
    ]

    for (const direction of directions) {
      const dx = direction[0]!
      const dy = direction[1]!
      const winningCells: Array<{ row: number; col: number }> = [{ row, col }]
      
      // Check positive direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row + dx * i
        const newCol = col + dy * i
        if (
          newRow >= 0 && newRow < ROWS &&
          newCol >= 0 && newCol < COLS &&
          board[newRow]![newCol] === player
        ) {
          winningCells.push({ row: newRow, col: newCol })
        } else {
          break
        }
      }
      
      // Check negative direction
      for (let i = 1; i < WIN_LENGTH; i++) {
        const newRow = row - dx * i
        const newCol = col - dy * i
        if (
          newRow >= 0 && newRow < ROWS &&
          newCol >= 0 && newCol < COLS &&
          board[newRow]![newCol] === player
        ) {
          winningCells.unshift({ row: newRow, col: newCol })
        } else {
          break
        }
      }
      
      if (winningCells.length >= WIN_LENGTH) {
        // Return exactly 4 consecutive cells
        const result = winningCells.slice(0, WIN_LENGTH)
        console.log("Winner found!", { player, winningCells: result, direction: [dx, dy] })
        return result
      }
    }
    
    return null
  }

  const isBoardFull = (board: Cell[][]): boolean => {
    return board[0]!.every((cell) => cell !== "")
  }

  const handleColumnClick = async (col: number) => {
    if (winner || isDraw || isLoading || isProcessingMove) return
    
    const row = getAvailableRow(col)
    if (row === null) return

    // Prevent multiple clicks
    setIsProcessingMove(true)

    // Start drop animation
    setAnimatingCell({ row, col })
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newBoard = board.map((r) => [...r])
    newBoard[row]![col] = currentPlayer
    setBoard(newBoard)
    setLastMove({ row, col })
    setAnimatingCell(null)

    const winningLine = checkWinner(newBoard, row, col, currentPlayer)
    if (winningLine) {
      console.log("Setting winner:", { currentPlayer, winningLine })
      setWinningLine(winningLine)
      setWinner(currentPlayer)
      setIsProcessingMove(false) // Re-enable after winner is set
      const winnerName = currentPlayer === "R" ? playerR : playerY
      toast.success(`${winnerName} wins!`, {
        description: "Four in a row!",
        duration: 5000,
      })
      announceOutcome(currentPlayer)
    } else if (isBoardFull(newBoard)) {
      setIsDraw(true)
      setIsProcessingMove(false) // Re-enable after draw is set
      toast.info("It's a draw!", {
        description: "The board is full.",
      })
      announceOutcome("draw")
    } else {
      setCurrentPlayer(currentPlayer === "R" ? "Y" : "R")
      
      // Computer's turn
      if (mode === "vs_computer" && currentPlayer === "R") {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        await handleComputerMove(newBoard)
        setIsLoading(false)
        setIsProcessingMove(false) // Re-enable after computer move
      } else {
        setIsProcessingMove(false) // Re-enable for next player in PvP mode
      }
    }
  }

  const handleComputerMove = async (currentBoard: Cell[][]) => {
    if (winner || isDraw) return

    // Try to win
    for (let col = 0; col < COLS; col++) {
      const row = getAvailableRow(col, currentBoard)
      if (row === null) continue
      
      const testBoard = currentBoard.map((r) => [...r])
      testBoard[row]![col] = "Y"
      const winningLine = checkWinner(testBoard, row, col, "Y")
      if (winningLine) {
        // Animate drop
        setAnimatingCell({ row, col })
        await new Promise((resolve) => setTimeout(resolve, 800))

        const newBoard = currentBoard.map((r) => [...r])
        newBoard[row]![col] = "Y"
        setBoard(newBoard)
        setLastMove({ row, col })
        setAnimatingCell(null)
        console.log("Computer wins:", { winningLine })
        setWinningLine(winningLine)
        setWinner("Y")
        toast.error(`${playerY} wins!`, {
          description: "Four in a row!",
          duration: 5000,
        })
        announceOutcome("Y")
        return
      }
    }

    // Try to block player
    for (let col = 0; col < COLS; col++) {
      const row = getAvailableRow(col, currentBoard)
      if (row === null) continue
      
      const testBoard = currentBoard.map((r) => [...r])
      testBoard[row]![col] = "R"
      if (checkWinner(testBoard, row, col, "R")) {
        // Animate drop
        setAnimatingCell({ row, col })
        await new Promise((resolve) => setTimeout(resolve, 800))

        const newBoard = currentBoard.map((r) => [...r])
        newBoard[row]![col] = "Y"
        setBoard(newBoard)
        setLastMove({ row, col })
        setAnimatingCell(null)
        
        if (isBoardFull(newBoard)) {
          setIsDraw(true)
          toast.info("It's a draw!", {
            description: "The board is full.",
          })
          announceOutcome("draw")
        } else {
          setCurrentPlayer("R")
        }
        return
      }
    }

    // Prefer center columns
    const centerCols = [3, 2, 4, 1, 5, 0, 6]
    for (const col of centerCols) {
      const row = getAvailableRow(col, currentBoard)
      if (row !== null) {
        // Animate drop
        setAnimatingCell({ row, col })
        await new Promise((resolve) => setTimeout(resolve, 800))

        const newBoard = currentBoard.map((r) => [...r])
        newBoard[row]![col] = "Y"
        setBoard(newBoard)
        setLastMove({ row, col })
        setAnimatingCell(null)
        setCurrentPlayer("R")
        return
      }
    }
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
            <Button variant="ghost" size="icon" onClick={resetBoard} disabled={isLoading}>
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
                  ? `🎉 Winner: ${winner === "R" ? playerR : playerY} 🎉`
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
                      disabled={!!winner || !!isDraw || isLoading || isProcessingMove || (mode === "vs_computer" && currentPlayer === "Y")}
                    >
                      ↓
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
