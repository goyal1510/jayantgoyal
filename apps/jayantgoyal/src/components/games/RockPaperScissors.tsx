"use client"

import Image from "next/image"
import * as React from "react"
import { Globe2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { cn } from "@repo/ui/lib/utils"

import { EMPTY_RPS_STATE } from "@/lib/games/rock-paper-scissors"
import {
  GameClockCard,
  ROUND_TIME_PRESETS,
  TimeControlPicker,
  useGameCountdown,
} from "@/components/games/game-time-controls"
import { GameSetupShell } from "@/components/games/game-setup-shell"

type Choice = "rock" | "paper" | "scissors"
type ComputerDifficulty = "casual" | "adaptive" | "ruthless"

const CHOICES: { key: Choice; label: string; image: string }[] = [
  {
    key: "rock",
    label: "Rock",
    image: "/assets/games/Rock-Paper-Scissor/resources/rock.png",
  },
  {
    key: "paper",
    label: "Paper",
    image: "/assets/games/Rock-Paper-Scissor/resources/paper.png",
  },
  {
    key: "scissors",
    label: "Scissors",
    image: "/assets/games/Rock-Paper-Scissor/resources/scissors.png",
  },
]

const DIFFICULTY_LABELS: Record<ComputerDifficulty, string> = {
  casual: "Casual",
  adaptive: "Adaptive",
  ruthless: "Ruthless",
}

const COUNTER_MOVE: Record<Choice, Choice> = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
}

function randomChoice() {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)]!.key
}

function mostCommonChoice(history: Choice[]) {
  if (history.length === 0) return null
  const counts = history.reduce<Record<Choice, number>>(
    (acc, choice) => {
      acc[choice] += 1
      return acc
    },
    { rock: 0, paper: 0, scissors: 0 }
  )
  return [...CHOICES].sort((a, b) => counts[b.key] - counts[a.key])[0]?.key ?? null
}

function chooseComputerChoice({
  playerChoice,
  playerHistory,
  difficulty,
}: {
  playerChoice: Choice
  playerHistory: Choice[]
  difficulty: ComputerDifficulty
}) {
  if (difficulty === "casual") return randomChoice()

  const predicted =
    difficulty === "ruthless"
      ? playerHistory.at(-1) ?? mostCommonChoice(playerHistory) ?? playerChoice
      : mostCommonChoice(playerHistory.slice(-5)) ?? playerChoice

  const skillChance = difficulty === "ruthless" ? 0.82 : 0.58
  return Math.random() < skillChance ? COUNTER_MOVE[predicted] : randomChoice()
}

export function RockPaperScissors() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = React.useState(false)
  const [playerName, setPlayerName] = React.useState("You")
  const [totals, setTotals] = React.useState({ humanWins: 0, computerWins: 0, draws: 0 })
  const [lastRound, setLastRound] = React.useState<{
    roundNumber: number
    userChoice: Choice
    computerChoice: Choice
    outcome: "win" | "loss" | "draw"
    timedOut?: boolean
  } | null>(null)
  const [message, setMessage] = React.useState<string>("Pick a move before the round timer expires.")
  const [selectedChoice, setSelectedChoice] = React.useState<Choice | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [roundSeconds, setRoundSeconds] = React.useState(10)
  const [roundResetKey, setRoundResetKey] = React.useState(0)
  const [difficulty, setDifficulty] = React.useState<ComputerDifficulty>("adaptive")
  const [playerHistory, setPlayerHistory] = React.useState<Choice[]>([])
  const [onlineName, setOnlineName] = React.useState("Player 1")
  const [joinCode, setJoinCode] = React.useState("")
  const [creatingRoom, setCreatingRoom] = React.useState(false)

  const getChoiceMeta = (key: Choice) =>
    CHOICES.find((choice) => choice.key === key) ?? CHOICES[0]!

  const playRound = async (choice: Choice, timedOut = false) => {
    setIsSubmitting(true)
    setSelectedChoice(choice)
    const computerChoice = chooseComputerChoice({
      playerChoice: choice,
      playerHistory,
      difficulty,
    })
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
      timedOut,
    }))
    setPlayerHistory((current) => [...current.slice(-9), choice])

    const nextMessage =
      timedOut
        ? `Time expired. ${getChoiceMeta(choice).label} was auto-picked.`
        : outcome === "draw"
          ? "Draw."
          : outcome === "win"
            ? "You win this round!"
            : "Computer wins this round."
    setMessage(nextMessage)
    if (timedOut) toast("Round timer expired", { description: nextMessage })
    else if (outcome === "win") toast.success("You win this round!")
    else if (outcome === "loss") toast.error("Computer wins this round.")
    else toast("Draw", { description: "Both picked the same move." })
    setIsSubmitting(false)
    setRoundResetKey((current) => current + 1)
  }

  const roundClock = useGameCountdown({
    durationSeconds: roundSeconds,
    active: gameStarted && !isSubmitting,
    resetKey: roundResetKey,
    onExpire: () => {
      const fallbackChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)]!.key
      void playRound(fallbackChoice, true)
    },
  })

  const resetLocal = () => {
    setTotals({ humanWins: 0, computerWins: 0, draws: 0 })
    setLastRound(null)
    setSelectedChoice(null)
    setPlayerHistory([])
    setMessage("Pick a move before the round timer expires.")
    setRoundResetKey((current) => current + 1)
  }

  const startLocalGame = () => {
    resetLocal()
    setPlayerName((current) => current.trim() || "You")
    setGameStarted(true)
  }

  const createOnlineRoom = async () => {
    setCreatingRoom(true)
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "rock-paper-scissors",
        displayName: onlineName,
        settings: { initialState: EMPTY_RPS_STATE },
      }),
    })
    setCreatingRoom(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to create Rock Paper Scissors room")
      return
    }

    const data = await response.json()
    const roomCode = data?.session?.session?.room_code
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned")
      return
    }

    router.push(`/games/rock-paper-scissors/room/${roomCode}`)
  }

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code")
      return
    }
    router.push(`/games/rock-paper-scissors/room/${roomCode}`)
  }

  if (!gameStarted) {
    return (
      <GameSetupShell
        title="Rock Paper Scissors"
        description="Set your player name, round timer, and computer difficulty before the first countdown starts."
        onStart={startLocalGame}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rps-player-name">Player name</Label>
            <Input
              id="rps-player-name"
              name="rps-player-name"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rps-computer-name">Opponent</Label>
            <Input id="rps-computer-name" value="Computer" disabled />
          </div>
        </div>

        <TimeControlPicker
          label="Round limit"
          presets={ROUND_TIME_PRESETS}
          valueSeconds={roundSeconds}
          onChange={(seconds) => {
            setRoundSeconds(seconds)
            setRoundResetKey((current) => current + 1)
          }}
        />

        <div className="rounded-lg border bg-background/70 p-3">
          <div className="mb-2 text-sm font-medium">Computer difficulty</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DIFFICULTY_LABELS) as ComputerDifficulty[]).map((level) => (
              <Button
                key={level}
                type="button"
                variant={difficulty === level ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(level)}
              >
                {DIFFICULTY_LABELS[level]}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Globe2 className="h-4 w-4" />
            Online room
          </div>
          <div className="space-y-2">
            <Label htmlFor="rps-online-name">Your display name</Label>
            <Input
              id="rps-online-name"
              value={onlineName}
              onChange={(event) => setOnlineName(event.target.value)}
            />
          </div>
          <Button onClick={createOnlineRoom} disabled={creatingRoom} className="w-full">
            {creatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create online room"}
          </Button>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={10}
            />
            <Button variant="outline" onClick={joinOnlineRoom}>
              Join
            </Button>
          </div>
        </div>
      </GameSetupShell>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Rock Paper Scissors</span>
          <Button variant="outline" size="sm" onClick={() => setGameStarted(false)} disabled={isSubmitting}>
            Setup
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CHOICES.map((choice) => (
            <Button
              key={choice.key}
              variant="secondary"
              className={cn(
                "flex min-h-[140px] flex-col items-center gap-3 py-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0",
                selectedChoice === choice.key && "ring-2 ring-rose-400 ring-offset-2"
              )}
              disabled={isSubmitting}
              onClick={() => playRound(choice.key)}
            >
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-lg border bg-background transition-transform duration-200",
                  selectedChoice === choice.key && "scale-105",
                  isSubmitting && selectedChoice === choice.key && "animate-pulse"
                )}
              >
                <Image
                  src={choice.image}
                  alt={choice.label}
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain transition-transform duration-200 group-hover:scale-105"
                  priority={choice.key === "rock"}
                />
              </div>
              <span className="text-sm font-medium">{choice.label}</span>
            </Button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
          <GameClockCard
            label="Round timer"
            helper="Auto-picks if it expires"
            remainingMs={roundClock.remainingMs}
            active={gameStarted && !isSubmitting}
            expired={roundClock.isExpired}
            tone="rose"
          />
          <TimeControlPicker
            label="Round limit"
            presets={ROUND_TIME_PRESETS}
            valueSeconds={roundSeconds}
            onChange={(seconds) => {
              setRoundSeconds(seconds)
              setRoundResetKey((current) => current + 1)
            }}
            disabled={isSubmitting}
          />
        </div>

        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="mb-2 text-sm font-medium">Computer difficulty</div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(DIFFICULTY_LABELS) as ComputerDifficulty[]).map((level) => (
              <Button
                key={level}
                type="button"
                variant={difficulty === level ? "default" : "outline"}
                size="sm"
                onClick={() => setDifficulty(level)}
                disabled={isSubmitting}
              >
                {DIFFICULTY_LABELS[level]}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="font-medium">Message</div>
          <div className="text-muted-foreground">
            {isSubmitting ? "Playing..." : `${message} ${DIFFICULTY_LABELS[difficulty]} bot active.`}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <StatBadge label={playerName} value={totals.humanWins} highlight />
          <StatBadge label="Computer" value={totals.computerWins} />
          <StatBadge label="Draws" value={totals.draws} />
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Last round</div>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {lastRound ? (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-3 rounded-md bg-background p-4 ring-1 ring-rose-300/60 transition">
                <div className="text-xs text-muted-foreground">You</div>
                <div className="flex items-center gap-2">
                  <div className="h-14 w-14 rounded-md border bg-muted/40 transition-transform duration-200 hover:scale-105">
                    <Image
                      src={getChoiceMeta(lastRound.userChoice).image}
                      alt={getChoiceMeta(lastRound.userChoice).label}
                      width={56}
                      height={56}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="font-semibold">
                    {getChoiceMeta(lastRound.userChoice).label}
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-md bg-background p-4 ring-1 ring-slate-300/60 transition">
                <div className="text-xs text-muted-foreground">Computer</div>
                <div className="flex items-center gap-2">
                  <div className="h-14 w-14 rounded-md border bg-muted/40 transition-transform duration-200 hover:scale-105">
                    <Image
                      src={getChoiceMeta(lastRound.computerChoice).image}
                      alt={getChoiceMeta(lastRound.computerChoice).label}
                      width={56}
                      height={56}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="font-semibold">
                    {getChoiceMeta(lastRound.computerChoice).label}
                  </div>
                </div>
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
                {lastRound.timedOut && " · timer auto-picked your move"}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-muted-foreground">No rounds yet.</div>
          )}
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Globe2 className="h-4 w-4" />
            Online room
          </div>
          <div className="space-y-2">
            <Label htmlFor="rps-online-name">Your display name</Label>
            <Input
              id="rps-online-name"
              value={onlineName}
              onChange={(event) => setOnlineName(event.target.value)}
            />
          </div>
          <Button onClick={createOnlineRoom} disabled={creatingRoom} className="w-full">
            {creatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create online room"}
          </Button>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Room code"
              maxLength={10}
            />
            <Button variant="outline" onClick={joinOnlineRoom}>
              Join
            </Button>
          </div>
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
