"use client"

import * as React from "react"
import { ArrowLeft, Copy, Dice5, Loader2, Share2, Trophy, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { cn } from "@repo/ui/lib/utils"

import type { JsonObject, OnlineSessionBundle } from "@/lib/games/online-sessions"
import {
  getFinishedLudoTokenCount,
  getLegalLudoMoves,
  getLudoTokenCoordinate,
  LUDO_PATH_COORDINATES,
  LUDO_SAFE_GLOBAL_INDICES,
  LUDO_SEAT_META,
  LUDO_SEATS,
  parseLudoState,
  type LudoSeat,
  type LudoState,
  type LudoToken,
} from "@/lib/games/ludo"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type Participant = {
  id: string
  display_name: string
  seat: LudoSeat
  user_id: string
}

type Session = {
  id: string
  room_code: string
  status: "waiting" | "active" | "completed" | "abandoned"
  current_turn_participant_id: string | null
  state: LudoState | JsonObject
}

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
  const coordinates: readonly (readonly [number, number])[] = seat === "P1"
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

function coerceBundle(bundle: OnlineSessionBundle | null): {
  session: Session | null
  participants: Participant[]
} {
  if (!bundle?.session) return { session: null, participants: [] }
  return {
    session: bundle.session as Session,
    participants: bundle.participants as Participant[],
  }
}

function getHomeSeat(row: number, column: number): LudoSeat | null {
  if (row <= 5 && column <= 5) return "P1"
  if (row <= 5 && column >= 9) return "P2"
  if (row >= 9 && column >= 9) return "P3"
  if (row >= 9 && column <= 5) return "P4"
  return null
}

function getVisualLudoSeat(seat: LudoSeat, activeSeats: readonly LudoSeat[]): LudoSeat {
  if (activeSeats.length === 2 && seat === "P2") return "P3"
  if (activeSeats.length === 3 && seat === "P3") return "P4"
  return seat
}

function getVisualLudoTokenCoordinate(token: LudoToken, activeSeats: readonly LudoSeat[]) {
  const visualSeat = getVisualLudoSeat(token.seat, activeSeats)
  return getLudoTokenCoordinate(
    visualSeat === token.seat ? token : { ...token, seat: visualSeat }
  )
}

function getCellClass(row: number, column: number, activeSeats: readonly LudoSeat[]) {
  const key = coordinateKey(row, column)
  const visualActiveSeats = activeSeats.map((seat) => getVisualLudoSeat(seat, activeSeats))
  const homeSeat = getHomeSeat(row, column)
  const homePathSeat = HOME_PATH_KEYS.get(key)
  const pathIndex = PATH_KEYS.get(key)

  if (row === 7 && column === 7) {
    return "rounded-xl border-zinc-300/40 bg-zinc-950/5 shadow-inner dark:border-zinc-700/60 dark:bg-white/5"
  }
  if (homePathSeat && visualActiveSeats.includes(homePathSeat)) return HOME_PATH_CLASSES[homePathSeat]
  if (typeof pathIndex === "number") {
    return cn(
      "rounded-full border-zinc-200 bg-white/95 shadow-sm dark:border-zinc-700 dark:bg-zinc-900",
      LUDO_SAFE_GLOBAL_INDICES.has(pathIndex) && "ring-2 ring-inset ring-amber-400"
    )
  }
  if (homeSeat && visualActiveSeats.includes(homeSeat)) return cn("rounded-full", HOME_CELL_CLASSES[homeSeat])
  return "border-transparent bg-transparent"
}

function tokensByCoordinate(tokens: LudoToken[], activeSeats: readonly LudoSeat[]) {
  const map = new Map<string, LudoToken[]>()
  for (const token of tokens) {
    const [row, column] = getVisualLudoTokenCoordinate(token, activeSeats)
    const key = coordinateKey(row, column)
    const existing = map.get(key) ?? []
    existing.push(token)
    map.set(key, existing)
  }
  return map
}

export function OnlineLudoRoom({ roomCode }: { roomCode: string }) {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [userId, setUserId] = React.useState<string | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const [participants, setParticipants] = React.useState<Participant[]>([])
  const [displayName, setDisplayName] = React.useState("Player")
  const [loading, setLoading] = React.useState(true)
  const [joining, setJoining] = React.useState(false)
  const [submittingAction, setSubmittingAction] = React.useState(false)
  const [needsJoin, setNeedsJoin] = React.useState(false)

  const refreshRoom = React.useCallback(async () => {
    const response = await fetch(`/api/games/sessions?roomCode=${encodeURIComponent(roomCode)}`)
    if (response.status === 403) {
      setNeedsJoin(true)
      setLoading(false)
      return
    }
    if (!response.ok) {
      setLoading(false)
      toast.error("Unable to load Ludo room")
      return
    }

    const data = (await response.json()) as { session: OnlineSessionBundle | null }
    const bundle = coerceBundle(data.session)
    setSession(bundle.session)
    setParticipants(bundle.participants)
    setNeedsJoin(false)
    setLoading(false)
  }, [roomCode])

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setDisplayName(data.user?.email?.split("@")[0] ?? "Player")
    })
  }, [supabase])

  React.useEffect(() => {
    refreshRoom()
  }, [refreshRoom])

  React.useEffect(() => {
    if (!session?.id) return

    const channel = supabase
      .channel(`ludo-${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "jg_app", table: "game_hub_sessions", filter: `id=eq.${session.id}` },
        refreshRoom
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "jg_app",
          table: "game_hub_session_participants",
          filter: `session_id=eq.${session.id}`,
        },
        refreshRoom
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "jg_app",
          table: "game_hub_session_moves",
          filter: `session_id=eq.${session.id}`,
        },
        refreshRoom
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshRoom, session?.id, supabase])

  const state = parseLudoState(session?.state)
  const me = participants.find((participant) => participant.user_id === userId)
  const currentParticipant = participants.find((participant) => participant.seat === state.currentSeat)
  const legalTokenIds = me ? getLegalLudoMoves(state, me.seat) : []
  const isMyTurn =
    session?.status === "active" &&
    me?.seat === state.currentSeat &&
    (!session.current_turn_participant_id || session.current_turn_participant_id === me.id)
  const canRoll = isMyTurn && state.phase === "roll" && session?.status === "active"
  const tokenMap = tokensByCoordinate(state.tokens, state.activeSeats)
  const currentVisualSeat = getVisualLudoSeat(state.currentSeat, state.activeSeats)
  const status =
    session?.status === "waiting"
      ? `Waiting for ${state.activeSeats.length - participants.length} player${state.activeSeats.length - participants.length === 1 ? "" : "s"}`
      : state.winner
        ? `${LUDO_SEAT_META[getVisualLudoSeat(state.winner, state.activeSeats)].label} wins`
        : `${LUDO_SEAT_META[currentVisualSeat].label} to ${state.phase}`

  const submitAction = async (actionPayload: JsonObject) => {
    if (submittingAction) return
    setSubmittingAction(true)
    const response = await fetch(`/api/games/ludo/${roomCode}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionPayload }),
    })
    setSubmittingAction(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to update Ludo room")
      return
    }

    const data = (await response.json()) as { session: OnlineSessionBundle | null }
    const bundle = coerceBundle(data.session)
    setSession(bundle.session)
    setParticipants(bundle.participants)
  }

  const joinRoom = async () => {
    setJoining(true)
    const response = await fetch(`/api/games/sessions/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    })
    setJoining(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to join Ludo room")
      return
    }

    const data = (await response.json()) as { session: OnlineSessionBundle | null }
    const bundle = coerceBundle(data.session)
    setSession(bundle.session)
    setParticipants(bundle.participants)
    setNeedsJoin(false)
  }

  const copyInvite = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/games/ludo/room/${roomCode}`)
    toast.success("Invite link copied")
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="overflow-hidden border-rose-200 bg-[radial-gradient(circle_at_top_left,#ffe4e6,transparent_34%),linear-gradient(135deg,#fff7ed,#fff1f2)] dark:border-rose-900/70 dark:bg-[linear-gradient(135deg,#111827,#4c0519)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-2">
            <Dice5 className="h-5 w-5 shrink-0 text-rose-600" />
            <span className="truncate">Ludo Room {roomCode}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/games/ludo")} aria-label="Back to Ludo">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={copyInvite} aria-label="Copy invite link">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <div
            className={cn(
              "relative mx-auto aspect-square w-full max-w-[min(92vw,720px)] overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-[radial-gradient(circle_at_center,#fff7ed,transparent_25%),linear-gradient(135deg,#ffffff,#f8fafc)] p-2 shadow-inner dark:border-zinc-800 dark:bg-[linear-gradient(135deg,#18181b,#09090b)]",
              state.activeSeats.length === 3 && "bg-[radial-gradient(circle_at_center,#ecfeff,transparent_24%),linear-gradient(135deg,#ffffff,#f8fafc)] dark:bg-[linear-gradient(135deg,#0f172a,#111827)]"
            )}
          >
            {state.activeSeats.length === 3 && (
              <div className="pointer-events-none absolute inset-5 z-0 border border-white/70 bg-white/30 shadow-inner [clip-path:polygon(50%_4%,96%_92%,4%_92%)] dark:border-white/10 dark:bg-white/5" />
            )}
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
                      "relative flex aspect-square min-w-0 items-center justify-center border text-[9px]",
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
                        const tokenCanMove = isMyTurn && legalTokenIds.includes(token.id) && state.phase === "move"
                        const visualSeat = getVisualLudoSeat(token.seat, state.activeSeats)
                        return (
                          <button
                            key={token.id}
                            type="button"
                            onClick={() => void submitAction({ action: "move", tokenId: token.id })}
                            disabled={!tokenCanMove || submittingAction}
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-black shadow-sm transition sm:h-6 sm:w-6",
                              TOKEN_CLASSES[visualSeat],
                              tokenCanMove && "scale-110 animate-bounce ring-2 ring-white hover:-translate-y-0.5 hover:shadow-lg",
                              !tokenCanMove && "disabled:cursor-default"
                            )}
                            aria-label={`token ${token.id}`}
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
                CENTER_GLOW_CLASSES[currentVisualSeat],
                !state.winner && "animate-pulse"
              )}
            />
            <button
              type="button"
              onClick={() => void submitAction({ action: "roll" })}
              disabled={!canRoll || submittingAction}
              className={cn(
                "absolute left-1/2 top-1/2 z-30 flex h-[18%] min-h-20 w-[18%] min-w-20 max-w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[1.35rem] border-2 p-2 text-center shadow-2xl ring-4 transition-all duration-300 sm:min-h-24 sm:min-w-24",
                CENTER_TURN_CLASSES[currentVisualSeat],
                canRoll && "hover:scale-105 active:scale-95",
                submittingAction && "animate-pulse",
                (!canRoll || submittingAction) && "cursor-default"
              )}
              aria-label={`Roll dice for ${LUDO_SEAT_META[currentVisualSeat].label}`}
              title={`Turn: ${LUDO_SEAT_META[currentVisualSeat].label}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-85">
                {state.phase === "roll" ? "Roll" : "Move"}
              </span>
              <span className="leading-none text-4xl font-black sm:text-5xl">
                {submittingAction ? "..." : state.diceValue ?? state.lastMove?.diceValue ?? "-"}
              </span>
              <span className="mt-1 max-w-full truncate text-[10px] font-semibold uppercase tracking-wide">
                {LUDO_SEAT_META[currentVisualSeat].label}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {needsJoin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Join room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ludo-room-name">Your display name</Label>
                <Input id="ludo-room-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </div>
              <Button onClick={joinRoom} disabled={joining} className="w-full">
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join room"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Table</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="text-lg font-semibold">{status}</div>
              <div className="text-xs text-muted-foreground">
                Turn {state.turnNumber} · Target {state.targetTokens}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {state.activeSeats.map((seat) => {
                const participant = participants.find((item) => item.seat === seat)
                const isCurrent = state.currentSeat === seat && session?.status !== "completed"
                const visualSeat = getVisualLudoSeat(seat, state.activeSeats)
                return (
                  <div key={seat} className={cn("rounded-lg border p-3", isCurrent && "ring-2 ring-rose-400")}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">{LUDO_SEAT_META[visualSeat].label}</div>
                      <div className={cn("h-3 w-3 rounded-full", TOKEN_CLASSES[visualSeat])} />
                    </div>
                    <div className="truncate font-medium">{participant?.display_name ?? "Open"}</div>
                    <div className="text-xs text-muted-foreground">
                      Home {getFinishedLudoTokenCount(state, seat)}/{state.targetTokens}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Current player</div>
              <div className="font-medium">{currentParticipant?.display_name ?? "Waiting"}</div>
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
              <Share2 className="h-4 w-4" />
              Invite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3 font-mono text-2xl font-semibold tracking-[0.2em]">
              {roomCode}
            </div>
            <Button variant="outline" onClick={copyInvite} className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copy invite link
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
