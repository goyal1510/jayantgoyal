"use client"

import { useEffect, useMemo, useState } from "react"
import { Bot, Dice5, Loader2, RotateCcw, Trophy, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { cn } from "@repo/ui/lib/utils"

import {
  applyLudoMove,
  applyLudoRoll,
  createLudoState,
  getFinishedLudoTokenCount,
  getLegalLudoMoves,
  getLudoTokenCoordinate,
  LUDO_PATH_COORDINATES,
  LUDO_SAFE_GLOBAL_INDICES,
  LUDO_SEAT_META,
  LUDO_SEATS,
  type LudoSeat,
  type LudoState,
  type LudoToken,
} from "@/lib/games/ludo"

type LudoMode = "local_pvp" | "vs_computer"

const TOKEN_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-700 bg-red-500 text-white shadow-red-900/30",
  P2: "border-emerald-700 bg-emerald-500 text-white shadow-emerald-900/30",
  P3: "border-amber-700 bg-amber-400 text-amber-950 shadow-amber-900/30",
  P4: "border-sky-700 bg-sky-500 text-white shadow-sky-900/30",
}

const HOME_CELL_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-200 bg-red-100/80 dark:border-red-900 dark:bg-red-950/40",
  P2: "border-emerald-200 bg-emerald-100/80 dark:border-emerald-900 dark:bg-emerald-950/40",
  P3: "border-amber-200 bg-amber-100/80 dark:border-amber-900 dark:bg-amber-950/40",
  P4: "border-sky-200 bg-sky-100/80 dark:border-sky-900 dark:bg-sky-950/40",
}

const HOME_PATH_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-300 bg-red-200 dark:border-red-900 dark:bg-red-950",
  P2: "border-emerald-300 bg-emerald-200 dark:border-emerald-900 dark:bg-emerald-950",
  P3: "border-amber-300 bg-amber-200 dark:border-amber-900 dark:bg-amber-950",
  P4: "border-sky-300 bg-sky-200 dark:border-sky-900 dark:bg-sky-950",
}

const HOME_PATH_KEYS = new Map<string, LudoSeat>()
for (const seat of LUDO_SEATS) {
  const coordinates: readonly (readonly [number, number])[] =
    seat === "P1"
      ? [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]]
      : seat === "P2"
        ? [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]]
        : seat === "P3"
          ? [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
          : [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]

  for (const [row, column] of coordinates) {
    HOME_PATH_KEYS.set(coordinateKey(row, column), seat)
  }
}

const PATH_KEYS = new Map<string, number>()
LUDO_PATH_COORDINATES.forEach(([row, column], index) => {
  PATH_KEYS.set(coordinateKey(row, column), index)
})

function coordinateKey(row: number, column: number) {
  return `${row}:${column}`
}

function getHomeSeat(row: number, column: number): LudoSeat | null {
  if (row <= 5 && column <= 5) return "P1"
  if (row <= 5 && column >= 9) return "P2"
  if (row >= 9 && column >= 9) return "P3"
  if (row >= 9 && column <= 5) return "P4"
  return null
}

function getCellClass(row: number, column: number) {
  const key = coordinateKey(row, column)
  const homeSeat = getHomeSeat(row, column)
  const homePathSeat = HOME_PATH_KEYS.get(key)
  const pathIndex = PATH_KEYS.get(key)

  if (row === 7 && column === 7) {
    return "border-zinc-300 bg-zinc-950 text-white dark:border-zinc-600"
  }
  if (homePathSeat) return HOME_PATH_CLASSES[homePathSeat]
  if (typeof pathIndex === "number") {
    return cn(
      "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
      LUDO_SAFE_GLOBAL_INDICES.has(pathIndex) && "ring-2 ring-inset ring-zinc-500"
    )
  }
  if (homeSeat) return HOME_CELL_CLASSES[homeSeat]
  return "border-transparent bg-transparent"
}

function tokensByCoordinate(tokens: LudoToken[]) {
  const map = new Map<string, LudoToken[]>()
  for (const token of tokens) {
    const [row, column] = getLudoTokenCoordinate(token)
    const key = coordinateKey(row, column)
    const existing = map.get(key) ?? []
    existing.push(token)
    map.set(key, existing)
  }
  return map
}

function rollDice() {
  return Math.floor(Math.random() * 6) + 1
}

function chooseComputerToken(state: LudoState, seat: LudoSeat) {
  const legalTokenIds = getLegalLudoMoves(state, seat)
  if (legalTokenIds.length === 0) return null

  const scoredTokens = legalTokenIds.map((tokenId) => {
    const token = state.tokens.find((item) => item.id === tokenId)
    const next = applyLudoMove(state, seat, tokenId)
    const movedToken = next.tokens.find((item) => item.id === tokenId)
    const captured = next.lastMove?.capturedTokenIds?.length ?? 0
    const finished = next.lastMove?.finished ? 1 : 0
    const progressGain = (movedToken?.progress ?? 0) - (token?.progress ?? 0)

    return {
      tokenId,
      score: finished * 1000 + captured * 350 + progressGain * 12 + Math.random() * 10,
    }
  })

  scoredTokens.sort((a, b) => b.score - a.score)
  return scoredTokens[0]?.tokenId ?? null
}

function LudoBoard({
  state,
  legalTokenIds,
  canMove,
  submitting,
  onTokenMove,
}: {
  state: LudoState
  legalTokenIds: string[]
  canMove: boolean
  submitting: boolean
  onTokenMove: (tokenId: string) => void
}) {
  const tokenMap = tokensByCoordinate(state.tokens)

  return (
    <div className="mx-auto grid w-full max-w-[min(92vw,720px)] grid-cols-[repeat(15,minmax(0,1fr))] rounded-2xl border bg-white/70 p-2 shadow-inner dark:bg-black/20">
      {Array.from({ length: 225 }, (_, index) => {
        const row = Math.floor(index / 15)
        const column = index % 15
        const key = coordinateKey(row, column)
        const tokens = tokenMap.get(key) ?? []
        const pathIndex = PATH_KEYS.get(key)

        return (
          <div
            key={key}
            className={cn(
              "relative flex aspect-square min-w-0 items-center justify-center border text-[9px]",
              getCellClass(row, column)
            )}
          >
            {typeof pathIndex === "number" && LUDO_SAFE_GLOBAL_INDICES.has(pathIndex) && (
              <span className="absolute left-1 top-0.5 text-[8px] font-semibold text-zinc-500">
                S
              </span>
            )}
            {row === 7 && column === 7 && (
              <span className="text-[8px] font-bold tracking-widest">HOME</span>
            )}
            <div className="flex flex-wrap items-center justify-center gap-0.5">
              {tokens.map((token) => {
                const tokenCanMove = canMove && legalTokenIds.includes(token.id)
                const label = `${LUDO_SEAT_META[token.seat].label} token ${token.index + 1}${
                  tokenCanMove ? ", legal move" : ""
                }`

                return (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => onTokenMove(token.id)}
                    disabled={!tokenCanMove || submitting}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-black shadow-sm transition sm:h-6 sm:w-6",
                      TOKEN_CLASSES[token.seat],
                      tokenCanMove && "scale-110 ring-2 ring-white hover:-translate-y-0.5",
                      !tokenCanMove && "disabled:cursor-default"
                    )}
                    aria-label={label}
                    title={label}
                  >
                    {token.index + 1}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Ludo() {
  const router = useRouter()
  const [mode, setMode] = useState<LudoMode>("vs_computer")
  const [roomCode, setRoomCode] = useState("")
  const [playerCount, setPlayerCount] = useState(2)
  const [targetTokens, setTargetTokens] = useState(4)
  const [state, setState] = useState(() => createLudoState(2, 4))
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [computerThinking, setComputerThinking] = useState(false)

  const isComputerTurn =
    mode === "vs_computer" &&
    state.currentSeat !== "P1" &&
    !state.winner
  const canAct = mode === "local_pvp" || state.currentSeat === "P1"
  const legalTokenIds = useMemo(
    () => getLegalLudoMoves(state, state.currentSeat),
    [state]
  )
  const status = state.winner
    ? `${LUDO_SEAT_META[state.winner].label} wins`
    : isComputerTurn || computerThinking
      ? `${LUDO_SEAT_META[state.currentSeat].label} computer thinking`
      : `${LUDO_SEAT_META[state.currentSeat].label} to ${state.phase}`

  const resetLocalGame = (nextMode = mode, nextPlayerCount = playerCount, nextTarget = targetTokens) => {
    const seats = nextMode === "vs_computer" ? 2 : nextPlayerCount
    setState(createLudoState(seats, nextTarget))
    setComputerThinking(false)
  }

  useEffect(() => {
    if (!isComputerTurn) return

    setComputerThinking(true)
    const timeoutId = window.setTimeout(() => {
      setState((current) => {
        if (current.winner || current.currentSeat === "P1") return current

        if (current.phase === "roll") {
          return applyLudoRoll(current, current.currentSeat, rollDice())
        }

        const tokenId = chooseComputerToken(current, current.currentSeat)
        return tokenId
          ? applyLudoMove(current, current.currentSeat, tokenId)
          : current
      })
      setComputerThinking(false)
    }, state.phase === "roll" ? 700 : 850)

    return () => window.clearTimeout(timeoutId)
  }, [isComputerTurn, state.currentSeat, state.phase])

  const handleRoll = () => {
    if (!canAct || state.phase !== "roll" || state.winner || computerThinking) return

    setState((current) =>
      applyLudoRoll(current, current.currentSeat, rollDice())
    )
  }

  const handleTokenMove = (tokenId: string) => {
    if (!canAct || state.phase !== "move" || state.winner || computerThinking) return

    setState((current) =>
      applyLudoMove(current, current.currentSeat, tokenId)
    )
  }

  const createRoom = async () => {
    setCreating(true)
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "ludo",
        displayName: "Ludo P1",
        settings: {
          maxPlayers: playerCount,
          targetTokens,
          initialState: createLudoState(playerCount, targetTokens),
        },
      }),
    })
    setCreating(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to create Ludo room")
      return
    }

    const data = await response.json()
    const nextRoomCode = data.session?.session?.room_code
    if (typeof nextRoomCode === "string") {
      router.push(`/games/ludo/room/${nextRoomCode}`)
    }
  }

  const joinRoom = () => {
    const normalized = roomCode.trim().toUpperCase()
    if (!normalized) {
      toast.error("Enter a room code")
      return
    }

    setJoining(true)
    router.push(`/games/ludo/room/${normalized}`)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden border-rose-200 bg-[radial-gradient(circle_at_top_left,#ffe4e6,transparent_34%),linear-gradient(135deg,#fff7ed,#fff1f2)] dark:border-rose-900/70 dark:bg-[linear-gradient(135deg,#111827,#4c0519)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-2">
            <Dice5 className="h-5 w-5 shrink-0 text-rose-600" />
            <span className="truncate">Ludo</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetLocalGame()}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <LudoBoard
            state={state}
            legalTokenIds={legalTokenIds}
            canMove={canAct && state.phase === "move"}
            submitting={computerThinking}
            onTokenMove={handleTokenMove}
          />
          <div className="mx-auto grid max-w-xl gap-3 rounded-xl border bg-background/85 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="truncate text-lg font-semibold">{status}</div>
              <div className="text-xs text-muted-foreground">
                Turn {state.turnNumber} - Target {state.targetTokens} token{state.targetTokens === 1 ? "" : "s"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-white text-3xl font-black text-zinc-950 shadow-sm">
                {state.diceValue ?? state.lastMove?.diceValue ?? "-"}
              </div>
              <Button
                onClick={handleRoll}
                disabled={!canAct || state.phase !== "roll" || !!state.winner || computerThinking}
                className="min-w-28"
              >
                {computerThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Roll"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Local table</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "vs_computer" ? "secondary" : "outline"}
                onClick={() => {
                  setMode("vs_computer")
                  resetLocalGame("vs_computer")
                }}
              >
                <Bot className="mr-2 h-4 w-4" />
                Vs Computer
              </Button>
              <Button
                type="button"
                variant={mode === "local_pvp" ? "secondary" : "outline"}
                onClick={() => {
                  setMode("local_pvp")
                  resetLocalGame("local_pvp")
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Local PvP
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Players</Label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((count) => (
                  <Button
                    key={count}
                    type="button"
                    variant={playerCount === count ? "secondary" : "outline"}
                    onClick={() => {
                      setPlayerCount(count)
                      resetLocalGame(mode, count)
                    }}
                    disabled={mode === "vs_computer" && count !== 2}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              {mode === "vs_computer" && (
                <p className="text-xs text-muted-foreground">
                  You play Red. Green is controlled by the computer.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Finish target</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={targetTokens === 1 ? "secondary" : "outline"}
                  onClick={() => {
                    setTargetTokens(1)
                    resetLocalGame(mode, playerCount, 1)
                  }}
                >
                  Quick
                </Button>
                <Button
                  type="button"
                  variant={targetTokens === 4 ? "secondary" : "outline"}
                  onClick={() => {
                    setTargetTokens(4)
                    resetLocalGame(mode, playerCount, 4)
                  }}
                >
                  Classic
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {state.activeSeats.map((seat) => {
                const isCurrent = state.currentSeat === seat && !state.winner
                return (
                  <div
                    key={seat}
                    className={cn("rounded-lg border p-3 text-sm", isCurrent && "ring-2 ring-rose-400")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {LUDO_SEAT_META[seat].label}
                      </div>
                      <div className={cn("h-3 w-3 rounded-full", TOKEN_CLASSES[seat])} />
                    </div>
                    <div className="font-medium">
                      {mode === "vs_computer" && seat !== "P1" ? "Computer" : "Player"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Home {getFinishedLudoTokenCount(state, seat)}/{state.targetTokens}
                    </div>
                  </div>
                )
              })}
            </div>

            {state.winner && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                <div className="flex items-center gap-2 font-semibold">
                  <Trophy className="h-4 w-4" />
                  {LUDO_SEAT_META[state.winner].label} wins
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Online room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => void createRoom()} disabled={creating} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Ludo room"}
            </Button>
            <div className="flex gap-2">
              <Input
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value)}
                placeholder="Room code"
                className="uppercase"
              />
              <Button variant="outline" onClick={joinRoom} disabled={joining}>
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
