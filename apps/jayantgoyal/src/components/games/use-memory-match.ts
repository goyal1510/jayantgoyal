"use client"

import { useEffect, useMemo, useState } from "react"

export type Mode = "local_pvp" | "vs_computer"

export type CardState = {
  id: number
  value: number
  flipped: boolean
  matched: boolean
}

export const DEFAULT_NAMES = {
  player1: "Player 1",
  player2: "Player 2",
}

export const GRID_SIZES = [
  { rows: 2, cols: 3, pairs: 3, label: "Easy (3 pairs)" },
  { rows: 3, cols: 4, pairs: 6, label: "Medium (6 pairs)" },
  { rows: 4, cols: 4, pairs: 8, label: "Hard (8 pairs)" },
] as const

function initializeCards(pairs: number): CardState[] {
  const values = Array.from({ length: pairs }, (_, i) => i + 1)
  const cardPairs = [...values, ...values]

  for (let i = cardPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardPairs[i], cardPairs[j]] = [cardPairs[j]!, cardPairs[i]!]
  }

  return cardPairs.map((value, index) => ({
    id: index,
    value,
    flipped: false,
    matched: false,
  }))
}

export function useMemoryMatch() {
  const [mode, setMode] = useState<Mode>("vs_computer")
  const [gridSize, setGridSize] = useState(1)
  const [cards, setCards] = useState<CardState[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [scores, setScores] = useState({ player1: 0, player2: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [showSetupSheet, setShowSetupSheet] = useState(true)
  const [player1Name, setPlayer1Name] = useState("You")
  const [player2Name, setPlayer2Name] = useState("Computer")
  const [gameStarted, setGameStarted] = useState(false)
  const [moves, setMoves] = useState(0)

  const playerLabels = useMemo(() => {
    return {
      current: currentPlayer === 1 ? player1Name : player2Name,
      modeLabel: mode === "vs_computer" ? "You vs Computer" : "Local PvP",
    }
  }, [currentPlayer, mode, player1Name, player2Name])

  const resetGame = () => {
    const pairs = GRID_SIZES[gridSize]!.pairs
    setCards(initializeCards(pairs))
    setFlippedCards([])
    setCurrentPlayer(1)
    setScores({ player1: 0, player2: 0 })
    setMoves(0)
    setGameStarted(false)
    setShowSetupSheet(true)
  }

  const startSession = (nextMode: Mode) => {
    setMode(nextMode)
    const pairs = GRID_SIZES[gridSize]!.pairs
    setCards(initializeCards(pairs))
    setFlippedCards([])
    setCurrentPlayer(1)
    setScores({ player1: 0, player2: 0 })
    setMoves(0)
    setGameStarted(true)
    setShowSetupSheet(false)

    if (nextMode === "vs_computer") {
      setPlayer1Name((current) => current.trim() || "You")
      setPlayer2Name("Computer")
    } else {
      setPlayer1Name((current) => current.trim() || DEFAULT_NAMES.player1)
      setPlayer2Name((current) => current.trim() || DEFAULT_NAMES.player2)
    }
  }

  useEffect(() => {
    setShowSetupSheet(true)
  }, [])

  const handleComputerMove = async (currentCards: CardState[]) => {
    if (isLoading || !gameStarted) return

    const allMatched = currentCards.every((c) => c.matched)
    if (allMatched) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const unmatchedCards = currentCards.filter((c) => !c.matched && !c.flipped)

    const knownCards = new Map<number, number[]>()
    currentCards.forEach((card) => {
      if (card.flipped && !card.matched) {
        if (!knownCards.has(card.value)) {
          knownCards.set(card.value, [])
        }
        knownCards.get(card.value)!.push(card.id)
      }
    })

    let firstCardId: number | null = null
    let secondCardId: number | null = null

    for (const [, ids] of knownCards.entries()) {
      if (ids.length >= 2) {
        firstCardId = ids[0]!
        secondCardId = ids[1]!
        break
      }
    }

    if (firstCardId === null || secondCardId === null) {
      const shuffled = [...unmatchedCards].sort(() => Math.random() - 0.5)
      firstCardId = shuffled[0]?.id ?? null
      secondCardId = shuffled[1]?.id ?? null
    }

    if (firstCardId !== null && secondCardId !== null) {
      const afterFirst = currentCards.map((c) =>
        c.id === firstCardId ? { ...c, flipped: true } : c
      )
      setCards(afterFirst)
      setFlippedCards([firstCardId])
      await new Promise((resolve) => setTimeout(resolve, 600))

      const afterSecond = afterFirst.map((c) =>
        c.id === secondCardId ? { ...c, flipped: true } : c
      )
      setCards(afterSecond)
      setFlippedCards([firstCardId, secondCardId])
      setMoves((prev) => prev + 1)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const firstCard = afterSecond.find((c) => c.id === firstCardId)!
      const secondCard = afterSecond.find((c) => c.id === secondCardId)!

      if (firstCard.value === secondCard.value) {
        const matched = afterSecond.map((c) =>
          c.id === firstCardId || c.id === secondCardId ? { ...c, matched: true, flipped: true } : c
        )
        setCards(matched)
        setScores((prev) => ({
          ...prev,
          player2: prev.player2 + 1,
        }))
        const allMatched = matched.every((c) => c.matched)
        if (allMatched) {
          setFlippedCards([])
          setIsLoading(false)
          return
        }

        setFlippedCards([])
        await new Promise((resolve) => setTimeout(resolve, 500))
        await handleComputerMove(matched)
        return
      } else {
        const flippedBack = afterSecond.map((c) =>
          c.id === firstCardId || c.id === secondCardId ? { ...c, flipped: false } : c
        )
        setCards(flippedBack)
      }

      setFlippedCards([])
      setCurrentPlayer(1)
    }

    setIsLoading(false)
  }

  const handleCardClick = async (cardId: number) => {
    if (isLoading || !gameStarted) return

    const card = cards.find((c) => c.id === cardId)
    if (!card || card.flipped || card.matched || flippedCards.length >= 2) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)

    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, flipped: true } : c
    )
    setCards(updatedCards)

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1)
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const [firstId, secondId] = newFlipped
      const firstCard = updatedCards.find((c) => c.id === firstId)!
      const secondCard = updatedCards.find((c) => c.id === secondId)!

      if (firstCard.value === secondCard.value) {
        const matchedCards = updatedCards.map((c) =>
          c.id === firstId || c.id === secondId ? { ...c, matched: true, flipped: true } : c
        )
        setCards(matchedCards)
        setScores((prev) => ({
          ...prev,
          [`player${currentPlayer}` as keyof typeof prev]: prev[`player${currentPlayer}` as keyof typeof prev] + 1,
        }))
        const allMatched = matchedCards.every((c) => c.matched)
        setFlippedCards([])
        setIsLoading(false)
        if (allMatched) {
          return
        }
      } else {
        const flippedBack = updatedCards.map((c) =>
          c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
        )
        setCards(flippedBack)
        setFlippedCards([])
        setIsLoading(false)

        setCurrentPlayer(currentPlayer === 1 ? 2 : 1)

        if (mode === "vs_computer" && currentPlayer === 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          await handleComputerMove(flippedBack)
        }
      }
    }
  }

  const gameOver = cards.length > 0 && cards.every((c) => c.matched)
  const winner = gameOver
    ? scores.player1 > scores.player2
      ? 1
      : scores.player2 > scores.player1
        ? 2
        : null
    : null

  return {
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
  }
}
