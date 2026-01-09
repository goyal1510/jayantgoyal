"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Loader2,
  RefreshCcw,
  Settings,
  User,
  UserCheck,
  Trophy,
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

type Mode = "local_pvp" | "vs_computer"

type CardState = {
  id: number
  value: number
  flipped: boolean
  matched: boolean
}

const DEFAULT_NAMES = {
  player1: "Player 1",
  player2: "Player 2",
}

const GRID_SIZES = [
  { rows: 2, cols: 3, pairs: 3, label: "Easy (3 pairs)" },
  { rows: 3, cols: 4, pairs: 6, label: "Medium (6 pairs)" },
  { rows: 4, cols: 4, pairs: 8, label: "Hard (8 pairs)" },
] as const

export function MemoryMatch() {
  const [mode, setMode] = useState<Mode>("vs_computer")
  const [gridSize, setGridSize] = useState(1) // 0: easy, 1: medium, 2: hard
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

  const initializeCards = (pairs: number) => {
    const values = Array.from({ length: pairs }, (_, i) => i + 1)
    const cardPairs = [...values, ...values]
    
    // Shuffle
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
      setPlayer1Name("You")
      setPlayer2Name("Computer")
    } else {
      setPlayer1Name(DEFAULT_NAMES.player1)
      setPlayer2Name(DEFAULT_NAMES.player2)
    }
  }

  useEffect(() => {
    setShowSetupSheet(true)
  }, [])

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
        // Match found - player continues
        const matchedCards = updatedCards.map((c) =>
          c.id === firstId || c.id === secondId ? { ...c, matched: true, flipped: true } : c
        )
        setCards(matchedCards)
        setScores((prev) => ({
          ...prev,
          [`player${currentPlayer}` as keyof typeof prev]: prev[`player${currentPlayer}` as keyof typeof prev] + 1,
        }))
        void playToastSound()
        
        // Check if game is over
        const allMatched = matchedCards.every((c) => c.matched)
        setFlippedCards([])
        setIsLoading(false)
        if (allMatched) {
          return
        }
        // Player continues - don't switch
      } else {
        // No match - flip back and switch player
        const flippedBack = updatedCards.map((c) =>
          c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
        )
        setCards(flippedBack)
        setFlippedCards([])
        setIsLoading(false)
        
        // Switch player
        setCurrentPlayer(currentPlayer === 1 ? 2 : 1)

        // Computer's turn
        if (mode === "vs_computer" && currentPlayer === 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          await handleComputerMove(flippedBack)
        }
      }
    }
  }

  const handleComputerMove = async (currentCards: CardState[]) => {
    if (isLoading || !gameStarted) return
    
    // Check if game is over
    const allMatched = currentCards.every((c) => c.matched)
    if (allMatched) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const unmatchedCards = currentCards.filter((c) => !c.matched && !c.flipped)
    
    // Try to find a pair from memory (simple strategy)
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

    // Try to match known pairs
    for (const [value, ids] of knownCards.entries()) {
      if (ids.length >= 2) {
        firstCardId = ids[0]!
        secondCardId = ids[1]!
        break
      }
    }

    // If no known pair, pick random cards
    if (firstCardId === null || secondCardId === null) {
      const shuffled = [...unmatchedCards].sort(() => Math.random() - 0.5)
      firstCardId = shuffled[0]?.id ?? null
      secondCardId = shuffled[1]?.id ?? null
    }

    if (firstCardId !== null && secondCardId !== null) {
      // Flip first card
      const afterFirst = currentCards.map((c) =>
        c.id === firstCardId ? { ...c, flipped: true } : c
      )
      setCards(afterFirst)
      setFlippedCards([firstCardId])
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Flip second card
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
        // Match found - computer continues
        const matched = afterSecond.map((c) =>
          c.id === firstCardId || c.id === secondCardId ? { ...c, matched: true, flipped: true } : c
        )
        setCards(matched)
        setScores((prev) => ({
          ...prev,
          player2: prev.player2 + 1,
        }))
        void playToastSound()
        
        // Check if game is over
        const allMatched = matched.every((c) => c.matched)
        if (allMatched) {
          setFlippedCards([])
          setIsLoading(false)
          return
        }
        
        // Computer continues playing
        setFlippedCards([])
        await new Promise((resolve) => setTimeout(resolve, 500))
        await handleComputerMove(matched)
        return
      } else {
        // No match - switch to player
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

  const totalPairs = GRID_SIZES[gridSize]!.pairs
  const gameOver = cards.length > 0 && cards.every((c) => c.matched)
  const winner = gameOver
    ? scores.player1 > scores.player2
      ? 1
      : scores.player2 > scores.player1
        ? 2
        : null
    : null

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
                      "aspect-square w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 transition-all",
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
