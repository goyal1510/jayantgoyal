"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

export type Mode = "local_pvp" | "vs_computer"
export type Cell = "R" | "Y" | ""
export type WinnerResult = "R" | "Y" | null

export const ROWS = 6
export const COLS = 7
const WIN_LENGTH = 4

const DEFAULT_NAMES = {
  R: "Player Red",
  Y: "Player Yellow",
}

export function createEmptyConnectFourBoard(): Cell[][] {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill("") as Cell[])
}

export function getAvailableRow(col: number, boardState: Cell[][]): number | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (boardState[row]![col] === "") {
      return row
    }
  }
  return null
}

export function checkWinner(board: Cell[][], row: number, col: number, player: "R" | "Y"): Array<{ row: number; col: number }> | null {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]

  for (const direction of directions) {
    const dx = direction[0]!
    const dy = direction[1]!
    const winningCells: Array<{ row: number; col: number }> = [{ row, col }]

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
      const result = winningCells.slice(0, WIN_LENGTH)
      console.log("Winner found!", { player, winningCells: result, direction: [dx, dy] })
      return result
    }
  }

  return null
}

export function isBoardFull(board: Cell[][]): boolean {
  return board[0]!.every((cell) => cell !== "")
}

export function useConnectFour() {
  const [mode, setMode] = useState<Mode>("vs_computer")
  const [board, setBoard] = useState<Cell[][]>(createEmptyConnectFourBoard())
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
      return
    }
    if (!outcome) return
  }

  const resetBoard = () => {
    setBoard(createEmptyConnectFourBoard())
    setCurrentPlayer("R")
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
    const newBoard = createEmptyConnectFourBoard()
    setBoard(newBoard)
    setCurrentPlayer("R")
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

  const handleComputerMove = async (currentBoard: Cell[][]) => {
    if (winner || isDraw) return

    for (let col = 0; col < COLS; col++) {
      const row = getAvailableRow(col, currentBoard)
      if (row === null) continue

      const testBoard = currentBoard.map((r) => [...r])
      testBoard[row]![col] = "Y"
      const winLine = checkWinner(testBoard, row, col, "Y")
      if (winLine) {
        setAnimatingCell({ row, col })
        await new Promise((resolve) => setTimeout(resolve, 800))

        const newBoard = currentBoard.map((r) => [...r])
        newBoard[row]![col] = "Y"
        setBoard(newBoard)
        setLastMove({ row, col })
        setAnimatingCell(null)
        console.log("Computer wins:", { winningLine: winLine })
        setWinningLine(winLine)
        setWinner("Y")
        toast.error(`${playerY} wins!`, {
          description: "Four in a row!",
          duration: 5000,
        })
        announceOutcome("Y")
        return
      }
    }

    for (let col = 0; col < COLS; col++) {
      const row = getAvailableRow(col, currentBoard)
      if (row === null) continue

      const testBoard = currentBoard.map((r) => [...r])
      testBoard[row]![col] = "R"
      if (checkWinner(testBoard, row, col, "R")) {
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

    const centerCols = [3, 2, 4, 1, 5, 0, 6]
    for (const col of centerCols) {
      const row = getAvailableRow(col, currentBoard)
      if (row !== null) {
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

  const handleColumnClick = async (col: number) => {
    if (winner || isDraw || isLoading || isProcessingMove) return

    const row = getAvailableRow(col, board)
    if (row === null) return

    setIsProcessingMove(true)

    setAnimatingCell({ row, col })
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newBoard = board.map((r) => [...r])
    newBoard[row]![col] = currentPlayer
    setBoard(newBoard)
    setLastMove({ row, col })
    setAnimatingCell(null)

    const winLine = checkWinner(newBoard, row, col, currentPlayer)
    if (winLine) {
      console.log("Setting winner:", { currentPlayer, winningLine: winLine })
      setWinningLine(winLine)
      setWinner(currentPlayer)
      setIsProcessingMove(false)
      const winnerName = currentPlayer === "R" ? playerR : playerY
      toast.success(`${winnerName} wins!`, {
        description: "Four in a row!",
        duration: 5000,
      })
      announceOutcome(currentPlayer)
    } else if (isBoardFull(newBoard)) {
      setIsDraw(true)
      setIsProcessingMove(false)
      toast.info("It's a draw!", {
        description: "The board is full.",
      })
      announceOutcome("draw")
    } else {
      setCurrentPlayer(currentPlayer === "R" ? "Y" : "R")

      if (mode === "vs_computer" && currentPlayer === "R") {
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        await handleComputerMove(newBoard)
        setIsLoading(false)
        setIsProcessingMove(false)
      } else {
        setIsProcessingMove(false)
      }
    }
  }

  return {
    mode,
    setMode,
    board,
    currentPlayer,
    winner,
    isDraw,
    isLoading,
    showSetupSheet,
    setShowSetupSheet,
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
  }
}
