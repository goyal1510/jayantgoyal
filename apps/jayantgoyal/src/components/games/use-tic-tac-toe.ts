"use client"

import { useEffect, useMemo, useState } from "react"

export type Mode = "local_pvp" | "vs_computer"
export type Cell = "X" | "O" | ""
export type WinnerResult = "X" | "O" | null

export type Move = {
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

export function useTicTacToe() {
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

  const currentSymbol: "O" | "X" = turnO ? "O" : "X"

  const announceOutcome = (outcome: WinnerResult | "draw") => {
    if (outcome === "draw") {
      return
    }
    if (!outcome) return
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

  return {
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
  }
}
