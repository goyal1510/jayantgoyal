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

import { GameSetupShell } from "@/components/games/game-setup-shell"
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
  LUDO_TOKENS_PER_PLAYER,
  LUDO_YARD_COORDINATES,
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
  P1: "border-red-200/80 bg-white/85 shadow-inner dark:border-red-900 dark:bg-red-950/50",
  P2: "border-emerald-200/80 bg-white/85 shadow-inner dark:border-emerald-900 dark:bg-emerald-950/50",
  P3: "border-amber-200/80 bg-white/85 shadow-inner dark:border-amber-900 dark:bg-amber-950/50",
  P4: "border-sky-200/80 bg-white/85 shadow-inner dark:border-sky-900 dark:bg-sky-950/50",
}

const HOME_PATH_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-300 bg-red-200 shadow-sm dark:border-red-900 dark:bg-red-950",
  P2: "border-emerald-300 bg-emerald-200 shadow-sm dark:border-emerald-900 dark:bg-emerald-950",
  P3: "border-amber-300 bg-amber-200 shadow-sm dark:border-amber-900 dark:bg-amber-950",
  P4: "border-sky-300 bg-sky-200 shadow-sm dark:border-sky-900 dark:bg-sky-950",
}

const HOME_PANEL_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-200 bg-red-500/10 dark:border-red-900/70 dark:bg-red-500/15",
  P2: "border-emerald-200 bg-emerald-500/10 dark:border-emerald-900/70 dark:bg-emerald-500/15",
  P3: "border-amber-200 bg-amber-400/10 dark:border-amber-900/70 dark:bg-amber-400/15",
  P4: "border-sky-200 bg-sky-500/10 dark:border-sky-900/70 dark:bg-sky-500/15",
}

const CENTER_TURN_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-200 bg-red-600 text-white shadow-red-900/35 ring-red-200/70 dark:border-red-300",
  P2: "border-emerald-200 bg-emerald-600 text-white shadow-emerald-900/35 ring-emerald-200/70 dark:border-emerald-300",
  P3: "border-amber-200 bg-amber-400 text-amber-950 shadow-amber-900/35 ring-amber-200/80 dark:border-amber-200",
  P4: "border-sky-200 bg-sky-600 text-white shadow-sky-900/35 ring-sky-200/70 dark:border-sky-300",
}

const CENTER_GLOW_CLASSES: Record<LudoSeat, string> = {
  P1: "bg-red-500/40",
  P2: "bg-emerald-500/40",
  P3: "bg-amber-400/45",
  P4: "bg-sky-500/40",
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

const YARD_KEYS = new Map<string, LudoSeat>()
for (const seat of LUDO_SEATS) {
  for (const [row, column] of LUDO_YARD_COORDINATES[seat]) {
    YARD_KEYS.set(coordinateKey(row, column), seat)
  }
}

function coordinateKey(row: number, column: number) {
  return `${row}:${column}`
}

function getCellClass(row: number, column: number, activeSeats: readonly LudoSeat[]) {
  const key = coordinateKey(row, column)
  const homePathSeat = HOME_PATH_KEYS.get(key)
  const pathIndex = PATH_KEYS.get(key)
  const yardSeat = YARD_KEYS.get(key)

  if (row === 7 && column === 7) {
    return "rounded-xl border-zinc-300/40 bg-zinc-950/5 shadow-inner dark:border-zinc-700/60 dark:bg-white/5"
  }
  if (homePathSeat && activeSeats.includes(homePathSeat)) return HOME_PATH_CLASSES[homePathSeat]
  if (yardSeat && activeSeats.includes(yardSeat)) return cn("rounded-full", HOME_CELL_CLASSES[yardSeat])
  if (typeof pathIndex === "number") {
    return cn(
      "rounded-full border-zinc-200 bg-white/95 shadow-sm dark:border-zinc-700 dark:bg-zinc-900",
      LUDO_SAFE_GLOBAL_INDICES.has(pathIndex) && "ring-2 ring-inset ring-amber-400"
    )
  }
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

function createLocalLudoState(maxPlayers = 2, targetTokens = LUDO_TOKENS_PER_PLAYER): LudoState {
  const playerCount = Math.min(Math.max(Math.trunc(maxPlayers), 2), 4)
  const activeSeats: LudoSeat[] =
    playerCount === 2 ? ["P1", "P3"] : playerCount === 3 ? ["P1", "P2", "P4"] : [...LUDO_SEATS]
  const normalizedTarget = Math.min(
    Math.max(Math.trunc(targetTokens), 1),
    LUDO_TOKENS_PER_PLAYER
  )

  return {
    activeSeats,
    currentSeat: "P1",
    tokens: activeSeats.flatMap((seat) =>
      Array.from({ length: LUDO_TOKENS_PER_PLAYER }, (_, index) => ({
        id: `${seat}-${index + 1}`,
        seat,
        index,
        progress: -1,
      }))
    ),
    diceValue: null,
    phase: "roll",
    turnNumber: 1,
    targetTokens: normalizedTarget,
    winner: null,
    lastMove: null,
  }
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
  canRoll,
  submitting,
  onRoll,
  onTokenMove,
  lastMovedTokenId,
  capturedTokenIds,
}: {
  state: LudoState
  legalTokenIds: string[]
  canMove: boolean
  canRoll: boolean
  submitting: boolean
  onRoll: () => void
  onTokenMove: (tokenId: string) => void
  lastMovedTokenId: string | null | undefined
  capturedTokenIds: Set<string>
}) {
  const tokenMap = tokensByCoordinate(state.tokens)
  const currentSeatMeta = LUDO_SEAT_META[state.currentSeat]
  const visibleDice = state.diceValue ?? state.lastMove?.diceValue
  const homePanels = [
    { seat: "P1" as LudoSeat, gridColumn: "1 / span 6", gridRow: "1 / span 6" },
    { seat: "P2" as LudoSeat, gridColumn: "10 / span 6", gridRow: "1 / span 6" },
    { seat: "P3" as LudoSeat, gridColumn: "10 / span 6", gridRow: "10 / span 6" },
    { seat: "P4" as LudoSeat, gridColumn: "1 / span 6", gridRow: "10 / span 6" },
  ].filter((panel) => state.activeSeats.includes(panel.seat))

  return (
    <div
      className={cn(
        "relative mx-auto aspect-square w-full max-w-[min(92vw,720px)] overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-[radial-gradient(circle_at_center,#fff7ed,transparent_25%),linear-gradient(135deg,#ffffff,#f8fafc)] p-2 shadow-inner dark:border-zinc-800 dark:bg-[linear-gradient(135deg,#18181b,#09090b)]",
        state.activeSeats.length === 3 && "bg-[radial-gradient(circle_at_center,#ecfeff,transparent_24%),linear-gradient(135deg,#ffffff,#f8fafc)] dark:bg-[linear-gradient(135deg,#0f172a,#111827)]"
      )}
    >
      {state.activeSeats.length === 3 && (
        <div className="pointer-events-none absolute inset-5 z-0 border border-white/70 bg-white/30 shadow-inner [clip-path:polygon(50%_4%,96%_92%,4%_92%)] dark:border-white/10 dark:bg-white/5" />
      )}
      <div className="pointer-events-none absolute inset-2 grid grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-[repeat(15,minmax(0,1fr))] gap-0.5">
        {homePanels.map((panel) => (
          <div
            key={panel.seat}
            className={cn(
              "rounded-[1.4rem] border backdrop-blur-sm",
              HOME_PANEL_CLASSES[panel.seat]
            )}
            style={{
              gridColumn: panel.gridColumn,
              gridRow: panel.gridRow,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 grid h-full w-full grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-[repeat(15,minmax(0,1fr))] gap-1">
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
                "relative flex aspect-square min-w-0 items-center justify-center text-[9px]",
                getCellClass(row, column, state.activeSeats)
              )}
            >
              {typeof pathIndex === "number" && LUDO_SAFE_GLOBAL_INDICES.has(pathIndex) && (
                <span className="absolute left-1/2 top-1/2 text-[8px] font-semibold text-amber-600 -translate-x-1/2 -translate-y-1/2">
                  ★
                </span>
              )}
              <div className="flex flex-wrap items-center justify-center gap-0.5">
                {tokens.map((token) => {
                  const tokenCanMove = canMove && legalTokenIds.includes(token.id)
                  const isLastMoved = lastMovedTokenId === token.id
                  const wasCaptured = capturedTokenIds.has(token.id)
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
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-black shadow-sm transition-all duration-200 sm:h-6 sm:w-6",
                        TOKEN_CLASSES[token.seat],
                        tokenCanMove && "scale-110 animate-bounce ring-2 ring-white hover:-translate-y-0.5 hover:shadow-lg",
                        isLastMoved && "scale-110 animate-pulse ring-2 ring-zinc-950 ring-offset-2 dark:ring-white",
                        wasCaptured && "opacity-70",
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
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 z-20 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-colors duration-500 sm:h-36 sm:w-36",
          CENTER_GLOW_CLASSES[state.currentSeat],
          !state.winner && "animate-pulse"
        )}
      />
      <button
        type="button"
        onClick={onRoll}
        disabled={!canRoll || submitting}
        className={cn(
          "absolute left-1/2 top-1/2 z-30 flex h-[18%] min-h-20 w-[18%] min-w-20 max-w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[1.35rem] border-2 p-2 text-center shadow-2xl ring-4 transition-all duration-300 sm:min-h-24 sm:min-w-24",
          CENTER_TURN_CLASSES[state.currentSeat],
          canRoll && "hover:scale-105 active:scale-95",
          submitting && "animate-pulse",
          (!canRoll || submitting) && "cursor-default"
        )}
        aria-label={`Roll dice for ${currentSeatMeta.label}`}
        title={`Turn: ${currentSeatMeta.label}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-85">
          {state.phase === "roll" ? "Roll" : "Move"}
        </span>
        <span className="leading-none text-4xl font-black sm:text-5xl">
          {submitting ? "..." : visibleDice ?? "-"}
        </span>
        <span className="mt-1 max-w-full truncate text-[10px] font-semibold uppercase tracking-wide">
          {currentSeatMeta.label}
        </span>
      </button>
    </div>
  )
}

export function Ludo() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [mode, setMode] = useState<LudoMode>("vs_computer")
  const [roomCode, setRoomCode] = useState("")
  const [playerCount, setPlayerCount] = useState(2)
  const [targetTokens, setTargetTokens] = useState(4)
  const [state, setState] = useState(() => createLocalLudoState(2, 4))
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [computerThinking, setComputerThinking] = useState(false)

  const isComputerTurn =
    gameStarted &&
    mode === "vs_computer" &&
    state.currentSeat !== "P1" &&
    !state.winner
  const canAct = gameStarted && (mode === "local_pvp" || state.currentSeat === "P1")
  const canRoll = canAct && state.phase === "roll" && !state.winner && !computerThinking
  const legalTokenIds = useMemo(
    () => getLegalLudoMoves(state, state.currentSeat),
    [state]
  )
  const lastMovedTokenId =
    state.lastMove?.action === "move" ? state.lastMove.tokenId : null
  const capturedTokenIds = new Set(state.lastMove?.capturedTokenIds ?? [])
  const status = state.winner
    ? `${LUDO_SEAT_META[state.winner].label} wins`
    : isComputerTurn || computerThinking
      ? `${LUDO_SEAT_META[state.currentSeat].label} computer thinking`
      : `${LUDO_SEAT_META[state.currentSeat].label} to ${state.phase}`

  const resetLocalGame = (nextMode = mode, nextPlayerCount = playerCount, nextTarget = targetTokens) => {
    const seats = nextMode === "vs_computer" ? 2 : nextPlayerCount
    setState(createLocalLudoState(seats, nextTarget))
    setComputerThinking(false)
  }

  const startLocalGame = () => {
    resetLocalGame()
    setGameStarted(true)
  }

  const openSetup = () => {
    resetLocalGame()
    setGameStarted(false)
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

  if (!gameStarted) {
    return (
      <GameSetupShell
        title="Ludo"
        description="Choose local/computer mode, player count, and finish target before the board accepts rolls."
        onStart={startLocalGame}
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "vs_computer" ? "secondary" : "outline"}
            onClick={() => {
              setMode("vs_computer")
              setPlayerCount(2)
              resetLocalGame("vs_computer", 2)
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
              You play Red. The opposite corner is controlled by the computer.
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

        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Online room
          </div>
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
        </div>
      </GameSetupShell>
    )
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
          <Button variant="ghost" size="sm" onClick={openSetup}>
            Setup
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <LudoBoard
            state={state}
            legalTokenIds={legalTokenIds}
            canMove={canAct && state.phase === "move"}
            canRoll={canRoll}
            submitting={computerThinking}
            onRoll={handleRoll}
            onTokenMove={handleTokenMove}
            lastMovedTokenId={lastMovedTokenId}
            capturedTokenIds={capturedTokenIds}
          />
          <div className="mx-auto max-w-xl rounded-xl border bg-background/85 p-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="truncate text-lg font-semibold">{status}</div>
              <div className="text-xs text-muted-foreground">
                Turn {state.turnNumber} - Target {state.targetTokens} token{state.targetTokens === 1 ? "" : "s"}
              </div>
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
                  You play Red. The opposite corner is controlled by the computer.
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
