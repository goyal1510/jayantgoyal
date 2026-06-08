import type { Metadata } from "next"
import Link from "next/link"
import type { ComponentType } from "react"
import {
  ArrowRight,
  Brain,
  Clock3,
  Crown,
  Dice5,
  Grid3X3,
  HandHeart,
  Layers,
  Play,
  Puzzle,
  Scissors,
  Trophy,
  Type,
  Users,
} from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { GAME_META } from "@/lib/games/config"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { cn } from "@repo/ui/lib/utils"

export const metadata: Metadata = {
  title: "Games",
  description:
    "Play interactive games — Tic Tac Toe, Connect Four, Memory Match, Wordle, Chess, Ludo, and more.",
}

const CARD_THEMES: Record<
  keyof typeof GAME_META,
  {
    gradient: string
    icon: ComponentType<{ className?: string }>
    accent: string
    accentText: string
    border: string
  }
> = {
  "tic-tac-toe": {
    gradient:
      "from-blue-200/50 via-slate-50 to-white dark:from-blue-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: Grid3X3,
    accent: "bg-blue-100/80 border-blue-200/70 dark:bg-blue-500/10 dark:border-blue-500/30",
    accentText: "text-blue-800 dark:text-blue-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  "rock-paper-scissors": {
    gradient:
      "from-purple-200/50 via-slate-50 to-white dark:from-purple-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: Scissors,
    accent:
      "bg-purple-100/80 border-purple-200/70 dark:bg-purple-500/10 dark:border-purple-500/30",
    accentText: "text-purple-800 dark:text-purple-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  "dare-x": {
    gradient:
      "from-emerald-200/50 via-slate-50 to-white dark:from-emerald-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: HandHeart,
    accent:
      "bg-emerald-100/80 border-emerald-200/70 dark:bg-emerald-500/10 dark:border-emerald-500/30",
    accentText: "text-emerald-800 dark:text-emerald-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  "connect-four": {
    gradient:
      "from-orange-200/50 via-slate-50 to-white dark:from-orange-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: Layers,
    accent:
      "bg-orange-100/80 border-orange-200/70 dark:bg-orange-500/10 dark:border-orange-500/30",
    accentText: "text-orange-800 dark:text-orange-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  "memory-match": {
    gradient:
      "from-pink-200/50 via-slate-50 to-white dark:from-pink-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: Brain,
    accent:
      "bg-pink-100/80 border-pink-200/70 dark:bg-pink-500/10 dark:border-pink-500/30",
    accentText: "text-pink-800 dark:text-pink-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  "wordle": {
    gradient:
      "from-emerald-200/50 via-slate-50 to-white dark:from-emerald-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: Puzzle,
    accent:
      "bg-emerald-100/80 border-emerald-200/70 dark:bg-emerald-500/10 dark:border-emerald-500/30",
    accentText: "text-emerald-800 dark:text-emerald-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  "typing-speed": {
    gradient:
      "from-cyan-200/50 via-slate-50 to-white dark:from-cyan-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: Type,
    accent:
      "bg-cyan-100/80 border-cyan-200/70 dark:bg-cyan-500/10 dark:border-cyan-500/30",
    accentText: "text-cyan-800 dark:text-cyan-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  chess: {
    gradient:
      "from-stone-300/70 via-amber-50 to-white dark:from-stone-500/25 dark:via-zinc-950 dark:to-black",
    icon: Crown,
    accent:
      "bg-stone-100/90 border-stone-300/80 dark:bg-stone-500/10 dark:border-stone-400/30",
    accentText: "text-stone-900 dark:text-stone-50",
    border: "border-stone-300/70 dark:border-stone-800",
  },
  ludo: {
    gradient:
      "from-rose-200/60 via-orange-50 to-white dark:from-rose-500/25 dark:via-zinc-950 dark:to-black",
    icon: Dice5,
    accent:
      "bg-rose-100/90 border-rose-300/80 dark:bg-rose-500/10 dark:border-rose-400/30",
    accentText: "text-rose-900 dark:text-rose-50",
    border: "border-rose-300/70 dark:border-rose-800",
  },
}

type GameSlug = keyof typeof GAME_META

type ActiveGameRoom = {
  id: string
  roomCode: string
  gameSlug: GameSlug
  gameName: string
  status: "waiting" | "active" | "completed" | "abandoned"
  seat: string
  isHost: boolean
  participantCount: number
  maxPlayers: number
  updatedAt: string
  href: string
}

type GameHistoryItem = {
  id: string
  roomCode: string
  gameSlug: GameSlug
  gameName: string
  outcome: "win" | "loss" | "draw" | "abandoned"
  completedAt: string
  href: string
  playAgainHref: string
}

type GameStats = {
  completed: number
  wins: number
  losses: number
  draws: number
  abandoned: number
}

function formatRoomUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

async function getActiveGameRooms(): Promise<ActiveGameRoom[]> {
  try {
    const auth = await createSupabaseServerClient()
    const {
      data: { user },
    } = await auth.auth.getUser()

    if (!user) return []

    const supabase = createSupabaseAdminClient()
    const { data: myParticipants, error: participantsError } = await supabase
      .schema("jg_app")
      .from("game_hub_session_participants")
      .select("session_id, seat, is_host, joined_at")
      .eq("user_id", user.id)
      .is("left_at", null)
      .order("joined_at", { ascending: false })
      .limit(20)

    if (participantsError || !myParticipants?.length) return []

    const sessionIds = myParticipants.map((participant) => participant.session_id)
    const { data: sessions, error: sessionsError } = await supabase
      .schema("jg_app")
      .from("game_hub_sessions")
      .select("id, room_code, game_slug, status, max_players, updated_at, expires_at")
      .in("id", sessionIds)
      .neq("status", "abandoned")
      .gte("expires_at", new Date().toISOString())
      .order("updated_at", { ascending: false })
      .limit(8)

    if (sessionsError || !sessions?.length) return []

    const { data: roomParticipants } = await supabase
      .schema("jg_app")
      .from("game_hub_session_participants")
      .select("session_id")
      .in("session_id", sessions.map((session) => session.id))
      .is("left_at", null)

    const participantCounts = new Map<string, number>()
    ;(roomParticipants ?? []).forEach((participant) => {
      participantCounts.set(
        participant.session_id,
        (participantCounts.get(participant.session_id) ?? 0) + 1
      )
    })

    const myParticipantBySession = new Map(
      myParticipants.map((participant) => [participant.session_id, participant])
    )

    return sessions
      .filter((session) => session.game_slug in GAME_META)
      .map((session) => {
        const gameSlug = session.game_slug as GameSlug
        const participant = myParticipantBySession.get(session.id)

        return {
          id: session.id,
          roomCode: session.room_code,
          gameSlug,
          gameName: GAME_META[gameSlug].name,
          status: session.status,
          seat: participant?.seat ?? "P",
          isHost: participant?.is_host ?? false,
          participantCount: participantCounts.get(session.id) ?? 1,
          maxPlayers: session.max_players,
          updatedAt: session.updated_at,
          href: `/games/${gameSlug}/room/${session.room_code}`,
        }
      })
  } catch (error) {
    console.error("Unable to load active game rooms:", error)
    return []
  }
}

async function getGameHistoryAndStats(): Promise<{
  history: GameHistoryItem[]
  stats: GameStats
}> {
  const emptyStats: GameStats = {
    completed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    abandoned: 0,
  }

  try {
    const auth = await createSupabaseServerClient()
    const {
      data: { user },
    } = await auth.auth.getUser()

    if (!user) return { history: [], stats: emptyStats }

    const supabase = createSupabaseAdminClient()
    const { data: myParticipants, error: participantsError } = await supabase
      .schema("jg_app")
      .from("game_hub_session_participants")
      .select("id, session_id")
      .eq("user_id", user.id)
      .is("left_at", null)
      .order("joined_at", { ascending: false })
      .limit(100)

    if (participantsError || !myParticipants?.length) {
      return { history: [], stats: emptyStats }
    }

    const sessionIds = myParticipants.map((participant) => participant.session_id)
    const participantBySession = new Map(
      myParticipants.map((participant) => [participant.session_id, participant.id])
    )
    const { data: sessions, error: sessionsError } = await supabase
      .schema("jg_app")
      .from("game_hub_sessions")
      .select(
        "id, room_code, game_slug, status, winner_participant_id, completed_at, updated_at"
      )
      .in("id", sessionIds)
      .in("status", ["completed", "abandoned"])
      .order("updated_at", { ascending: false })
      .limit(50)

    if (sessionsError || !sessions?.length) {
      return { history: [], stats: emptyStats }
    }

    const { data: results } = await supabase
      .schema("jg_app")
      .from("game_hub_session_results")
      .select("session_id, winner_participant_id, outcome, created_at")
      .in("session_id", sessions.map((session) => session.id))

    const resultBySession = new Map(
      (results ?? []).map((result) => [result.session_id, result])
    )
    const stats = { ...emptyStats }

    const history = sessions
      .filter((session) => session.game_slug in GAME_META)
      .map((session) => {
        const gameSlug = session.game_slug as GameSlug
        const myParticipantId = participantBySession.get(session.id)
        const result = resultBySession.get(session.id)
        const winnerParticipantId =
          result?.winner_participant_id ?? session.winner_participant_id
        const resultOutcome = result?.outcome
        const outcome: GameHistoryItem["outcome"] =
          session.status === "abandoned" || resultOutcome === "abandoned"
            ? "abandoned"
            : resultOutcome === "draw" || !winnerParticipantId
              ? "draw"
              : winnerParticipantId === myParticipantId
                ? "win"
                : "loss"

        stats.completed += 1
        if (outcome === "win") stats.wins += 1
        if (outcome === "loss") stats.losses += 1
        if (outcome === "draw") stats.draws += 1
        if (outcome === "abandoned") stats.abandoned += 1

        return {
          id: session.id,
          roomCode: session.room_code,
          gameSlug,
          gameName: GAME_META[gameSlug].name,
          outcome,
          completedAt:
            result?.created_at ?? session.completed_at ?? session.updated_at,
          href: `/games/${gameSlug}/room/${session.room_code}`,
          playAgainHref: `/games/${gameSlug}`,
        }
      })
      .slice(0, 8)

    return { history, stats }
  } catch (error) {
    console.error("Unable to load game history:", error)
    return { history: [], stats: emptyStats }
  }
}

export default async function GamesPage() {
  const [activeRooms, historyAndStats] = await Promise.all([
    getActiveGameRooms(),
    getGameHistoryAndStats(),
  ])
  const { history, stats } = historyAndStats
  const cards = Object.entries(GAME_META).map(([slug, meta]) => {
    const theme = CARD_THEMES[slug as keyof typeof GAME_META]
    const modesLabel =
      meta.modeLabel ??
      (meta.modes.length === 2
        ? "PvP • Computer"
        : meta.modes[0] === "local_pvp"
          ? "Local PvP"
          : "Computer")
    return {
      slug,
      name: meta.name,
      description: meta.description,
      modesLabel,
      onlineReady: meta.onlineReady === true,
      theme,
    }
  })

  return (
    <div className="p-4 space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Completed", stats.completed],
          ["Wins", stats.wins],
          ["Losses", stats.losses],
          ["Draws", stats.draws],
          ["Abandoned", stats.abandoned],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background p-4">
            <div className="text-xs uppercase text-muted-foreground">
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </section>

      {activeRooms.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Continue Rooms</h2>
              <p className="text-sm text-muted-foreground">
                Active online sessions joined by this account.
              </p>
            </div>
            <Badge variant="secondary">{activeRooms.length} active</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {activeRooms.map((room) => (
              <Link
                key={room.id}
                href={room.href}
                className="group rounded-lg border bg-background p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {room.gameName}
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      {room.roomCode}
                    </div>
                  </div>
                  <Badge
                    variant={room.status === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {room.status}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {room.participantCount}/{room.maxPlayers}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Play className="h-3.5 w-3.5" />
                    {room.isHost ? "Host" : `Seat ${room.seat}`}
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatRoomUpdatedAt(room.updatedAt)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent Results</h2>
              <p className="text-sm text-muted-foreground">
                Completed online sessions for this account.
              </p>
            </div>
            <Badge variant="secondary">{history.length} recent</Badge>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[1fr_110px_140px_110px] gap-3 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              <div>Game</div>
              <div>Result</div>
              <div>Completed</div>
              <div></div>
            </div>
            <div className="divide-y">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_110px_140px_110px] items-center gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{item.gameName}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {item.roomCode}
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant={item.outcome === "win" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {item.outcome}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatRoomUpdatedAt(item.completedAt)}
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={item.playAgainHref}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      Play Again
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.theme.icon
          return (
            <Link
              key={card.slug}
              href={`/games/${card.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-5 transition hover:shadow-md",
                "bg-gradient-to-br",
                card.theme.gradient,
                card.theme.border
              )}
            >
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_25%)]" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs text-slate-700 dark:text-muted-foreground/90">
                      <span className="font-medium">{card.modesLabel}</span>
                    </div>
                    <div className="text-xl font-semibold text-slate-900 dark:text-white drop-shadow-sm">
                      {card.name}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-200/80">
                      {card.description}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-full border p-3 text-white/90 shadow-lg",
                      card.theme.accent,
                      card.theme.accentText
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-800 dark:text-slate-200/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs bg-white/70 text-slate-800 dark:bg-black/20 dark:text-slate-200">
                      Ready to play
                    </span>
                    {card.onlineReady && (
                      <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs bg-white/70 text-slate-800 dark:bg-black/20 dark:text-slate-200">
                        Online rooms
                      </span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
