"use client"

import { useMemo, useState } from "react"
import { Loader2, RefreshCcw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { playToastSound } from "@/lib/sound"

type Attempt = {
  id: string
  dare_text: string
  status: "done" | "not_done"
  player_name: string
  created_at?: string | null
}

const FALLBACK_DARES = [
  "Do 10 jumping jacks.",
  "Sing a line from your favorite song.",
  "Share a fun fact you know.",
  "Do a silly dance for 10 seconds.",
  "Tell a joke.",
  "Act like a robot for 15 seconds.",
  "Name three cities you want to visit.",
] as const

export function DareX() {
  const [hasStarted, setHasStarted] = useState(false)
  const [playerOne, setPlayerOne] = useState("Player 1")
  const [playerTwo, setPlayerTwo] = useState("Player 2")
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [currentDare, setCurrentDare] = useState<string>("Press start to get a dare.")
  const [history, setHistory] = useState<Attempt[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const darePool = useMemo(() => FALLBACK_DARES, [])

  const startSession = () => {
    setIsLoading(true)
    setHasStarted(true)
    setHistory([])
    setCurrentPlayer(1)
    pickNextDare()
    setIsLoading(false)
  }

  const pickNextDare = () => {
    const idx = Math.floor(Math.random() * darePool.length)
    setCurrentDare(darePool[idx] ?? "No dare available.")
  }

  const submitAttempt = (status: "done" | "not_done") => {
    if (!hasStarted) return
    setIsLoading(true)
    const playerName = currentPlayer === 1 ? playerOne : playerTwo
    const attemptId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString()
    setHistory((prev) => [
      { id: attemptId, dare_text: currentDare, status, player_name: playerName, created_at: new Date().toISOString() },
      ...prev,
    ])
    if (status === "done") {
      toast.success(`${playerName} completed the dare!`)
      void playToastSound()
    } else {
      toast("Not done", { description: `${playerName} skipped this one.` })
      void playToastSound()
    }
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    pickNextDare()
    setIsLoading(false)
  }

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dare X</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={pickNextDare} disabled={isLoading || !hasStarted}>
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setHistory([])} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Player 1</label>
            <Input
              value={playerOne}
              onChange={(e) => setPlayerOne(e.target.value)}
              disabled={hasStarted || isLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Player 2</label>
            <Input
              value={playerTwo}
              onChange={(e) => setPlayerTwo(e.target.value)}
              disabled={hasStarted || isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <div>
            <div className="text-xs text-muted-foreground">Current Player</div>
            <div className="text-lg font-semibold">{currentPlayer === 1 ? playerOne : playerTwo}</div>
          </div>
          <Button onClick={() => setCurrentPlayer(currentPlayer === 1 ? 2 : 1)} variant="outline" size="sm">
            Swap
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">Current Dare</div>
          <div className="text-base font-semibold leading-relaxed">{currentDare}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={startSession} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start / Restart"}
          </Button>
          <Button variant="secondary" onClick={() => pickNextDare()} disabled={!hasStarted || isLoading}>
            Next Dare
          </Button>
          <Button variant="outline" onClick={() => submitAttempt("done")} disabled={!hasStarted || isLoading}>
            Done
          </Button>
          <Button variant="outline" onClick={() => submitAttempt("not_done")} disabled={!hasStarted || isLoading}>
            Not Done
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-sm font-medium mb-2">History</div>
          {history.length === 0 ? (
            <div className="text-xs text-muted-foreground">No attempts recorded yet.</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-sm">
              {history.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-start justify-between rounded-md bg-background p-2"
                >
                  <div>
                    <div className="font-medium">{attempt.player_name}</div>
                    <div className="text-xs text-muted-foreground">{attempt.dare_text}</div>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase">{attempt.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
