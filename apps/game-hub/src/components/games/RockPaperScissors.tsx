"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { playToastSound } from "@/lib/sound"

type Choice = "rock" | "paper" | "scissors"

const CHOICES: { key: Choice; label: string; emoji: string }[] = [
  { key: "rock", label: "Rock", emoji: "✊" },
  { key: "paper", label: "Paper", emoji: "✋" },
  { key: "scissors", label: "Scissors", emoji: "✌️" },
]

export function RockPaperScissors() {
  const [totals, setTotals] = useState({ humanWins: 0, computerWins: 0, draws: 0 })
  const [lastRound, setLastRound] = useState<{
    roundNumber: number
    userChoice: Choice
    computerChoice: Choice
    outcome: "win" | "loss" | "draw"
  } | null>(null)
  const [message, setMessage] = useState<string>("Pick a move to start playing.")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const playRound = async (choice: Choice) => {
    setIsSubmitting(true)
    const computerChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)]!.key
    const humanWins =
      (choice === "rock" && computerChoice === "scissors") ||
      (choice === "paper" && computerChoice === "rock") ||
      (choice === "scissors" && computerChoice === "paper")
    const isDraw = choice === computerChoice
    const outcome: "win" | "loss" | "draw" = isDraw ? "draw" : humanWins ? "win" : "loss"

    setTotals((prev) => {
      const next = { ...prev }
      if (outcome === "win") next.humanWins += 1
      if (outcome === "loss") next.computerWins += 1
      if (outcome === "draw") next.draws += 1
      return next
    })

    setLastRound((prev) => ({
      roundNumber: (prev?.roundNumber ?? 0) + 1,
      userChoice: choice,
      computerChoice,
      outcome,
    }))

    const nextMessage =
      outcome === "draw"
        ? "Draw."
        : outcome === "win"
          ? "You win this round!"
          : "Computer wins this round."
    setMessage(nextMessage)
    if (outcome === "win") toast.success("You win this round!")
    else if (outcome === "loss") toast.error("Computer wins this round.")
    else toast("Draw", { description: "Both picked the same move." })
    void playToastSound()
    setIsSubmitting(false)
  }

  const resetLocal = () => {
    setTotals({ humanWins: 0, computerWins: 0, draws: 0 })
    setLastRound(null)
    setMessage("Pick a move to start playing.")
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Rock Paper Scissors</span>
          <Button variant="outline" size="sm" onClick={resetLocal} disabled={isSubmitting}>
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {CHOICES.map((choice) => (
            <Button
              key={choice.key}
              variant="secondary"
              className="flex flex-col gap-1 py-4"
              disabled={isSubmitting}
              onClick={() => playRound(choice.key)}
            >
              <span className="text-2xl">{choice.emoji}</span>
              <span className="text-sm font-medium">{choice.label}</span>
            </Button>
          ))}
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="font-medium">Message</div>
          <div className="text-muted-foreground">{isSubmitting ? "Playing..." : message}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <StatBadge label="You" value={totals.humanWins} highlight />
          <StatBadge label="Computer" value={totals.computerWins} />
          <StatBadge label="Draws" value={totals.draws} />
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Last round</div>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {lastRound ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-md bg-background p-2">
                <div className="text-xs text-muted-foreground">You</div>
                <div className="font-semibold">{lastRound.userChoice}</div>
              </div>
              <div className="rounded-md bg-background p-2">
                <div className="text-xs text-muted-foreground">Computer</div>
                <div className="font-semibold">{lastRound.computerChoice}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                Round {lastRound.roundNumber} result:{" "}
                <span className="font-semibold text-foreground">
                  {lastRound.outcome === "draw"
                    ? "Draw"
                    : lastRound.outcome === "win"
                      ? "You win"
                      : "Computer wins"}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-muted-foreground">No rounds yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatBadge({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className="rounded-lg border bg-background p-3 text-center"
      data-highlight={highlight}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
