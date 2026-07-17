"use client";

import * as React from "react";
import { Copy, Loader2, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { cn } from "@repo/ui/lib/utils";

import { OnlineRoomHeader } from "@/components/games/online-room-header";
import type {
  JsonObject,
  OnlineSessionBundle,
} from "@/lib/games/online-sessions";
import {
  MEMORY_MATCH_DIFFICULTIES,
  parseMemoryMatchState,
  type MemoryMatchState,
} from "@/lib/games/memory-match";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Participant = {
  id: string;
  display_name: string;
  seat: "P1" | "P2";
  user_id: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed" | "abandoned";
  current_turn_participant_id: string | null;
  state: MemoryMatchState | JsonObject;
};

function coerceBundle(bundle: OnlineSessionBundle | null): {
  session: Session | null;
  participants: Participant[];
} {
  if (!bundle?.session) return { session: null, participants: [] };
  return {
    session: bundle.session as Session,
    participants: bundle.participants as Participant[],
  };
}

export function OnlineMemoryMatchRoom({ roomCode }: { roomCode: string }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [displayName, setDisplayName] = React.useState("Player");
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [submittingFlip, setSubmittingFlip] = React.useState(false);
  const [needsJoin, setNeedsJoin] = React.useState(false);

  const refreshRoom = React.useCallback(async () => {
    const response = await fetch(
      `/api/games/sessions?roomCode=${encodeURIComponent(roomCode)}`,
    );
    if (response.status === 403) {
      setNeedsJoin(true);
      setLoading(false);
      return;
    }
    if (!response.ok) {
      setLoading(false);
      toast.error("Unable to load Memory Match room");
      return;
    }

    const data = (await response.json()) as {
      session: OnlineSessionBundle | null;
    };
    const bundle = coerceBundle(data.session);
    setSession(bundle.session);
    setParticipants(bundle.participants);
    setNeedsJoin(false);
    setLoading(false);
  }, [roomCode]);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setDisplayName(data.user?.email?.split("@")[0] ?? "Player");
    });
  }, [supabase]);

  React.useEffect(() => {
    refreshRoom();
  }, [refreshRoom]);

  React.useEffect(() => {
    if (!session?.id) return;

    const channel = supabase
      .channel(`memory-match-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "jg_app",
          table: "game_hub_sessions",
          filter: `id=eq.${session.id}`,
        },
        refreshRoom,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "jg_app",
          table: "game_hub_session_participants",
          filter: `session_id=eq.${session.id}`,
        },
        refreshRoom,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "jg_app",
          table: "game_hub_session_moves",
          filter: `session_id=eq.${session.id}`,
        },
        refreshRoom,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshRoom, session?.id, supabase]);

  const state = parseMemoryMatchState(session?.state);
  const playerOne = participants.find(
    (participant) => participant.seat === "P1",
  );
  const playerTwo = participants.find(
    (participant) => participant.seat === "P2",
  );
  const me = participants.find((participant) => participant.user_id === userId);
  const currentParticipant = participants.find(
    (participant) => participant.seat === state.currentSeat,
  );
  const difficulty = MEMORY_MATCH_DIFFICULTIES[state.difficulty];
  const isMyTurn =
    session?.status === "active" &&
    me?.seat === state.currentSeat &&
    (!session.current_turn_participant_id ||
      session.current_turn_participant_id === me.id);

  const status =
    session?.status === "waiting"
      ? "Waiting for P2"
      : state.winner
        ? `${state.winner} wins`
        : state.isDraw
          ? "Draw"
          : `${state.currentSeat} to flip`;

  const joinRoom = async () => {
    setJoining(true);
    const response = await fetch(`/api/games/sessions/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    setJoining(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to join Memory Match room");
      return;
    }

    const data = (await response.json()) as {
      session: OnlineSessionBundle | null;
    };
    const bundle = coerceBundle(data.session);
    setSession(bundle.session);
    setParticipants(bundle.participants);
    setNeedsJoin(false);
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/games/memory-match/room/${roomCode}`,
    );
    toast.success("Invite link copied");
  };

  const submitFlip = async (cardId: number) => {
    if (!isMyTurn || submittingFlip || state.winner || state.isDraw) return;
    const card = state.cards.find((item) => item.id === cardId);
    if (
      !card ||
      card.flipped ||
      card.matched ||
      state.selectedCards.length >= 2
    )
      return;

    setSubmittingFlip(true);
    const response = await fetch(`/api/games/memory-match/${roomCode}/flips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movePayload: { cardId } }),
    });
    setSubmittingFlip(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to flip card");
      return;
    }

    const data = (await response.json()) as {
      session: OnlineSessionBundle | null;
    };
    const bundle = coerceBundle(data.session);
    setSession(bundle.session);
    setParticipants(bundle.participants);
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="overflow-hidden border-pink-200 bg-[radial-gradient(circle_at_top_left,#fce7f3,transparent_34%),linear-gradient(135deg,#fff7ed,#fdf2f8)] dark:border-pink-900/70 dark:bg-[linear-gradient(135deg,#1f2937,#4c1d35)]">
        <OnlineRoomHeader
          game="memory-match"
          roomCode={roomCode}
          status={status}
          onCopyInvite={copyInvite}
        />
        <CardContent className="flex justify-center pb-6">
          <div
            className={cn(
              "grid w-full max-w-[min(90vw,620px)] gap-2",
              difficulty.columns === 3 ? "grid-cols-3" : "grid-cols-4",
            )}
          >
            {state.cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => void submitFlip(card.id)}
                disabled={
                  !isMyTurn ||
                  card.flipped ||
                  card.matched ||
                  state.selectedCards.length >= 2 ||
                  submittingFlip ||
                  !!state.winner ||
                  state.isDraw
                }
                className={cn(
                  "aspect-square rounded-xl border-2 text-2xl font-black transition sm:text-4xl",
                  "disabled:cursor-not-allowed disabled:opacity-90",
                  card.matched
                    ? "border-emerald-400 bg-emerald-100 text-emerald-700 dark:bg-emerald-950"
                    : card.flipped
                      ? "border-pink-400 bg-white text-pink-700 shadow-sm dark:bg-pink-950"
                      : "border-pink-200 bg-white/85 text-pink-300 hover:-translate-y-0.5 hover:bg-pink-50 dark:border-pink-900 dark:bg-slate-950 dark:text-pink-800",
                  state.lastMove?.cardIds.includes(card.id) &&
                    "ring-2 ring-pink-400",
                )}
                aria-label={`memory card ${card.id}`}
              >
                {card.flipped || card.matched ? card.value : "?"}
              </button>
            ))}
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
                <Label htmlFor="memory-room-name">Your display name</Label>
                <Input
                  id="memory-room-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <Button onClick={joinRoom} disabled={joining} className="w-full">
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join as P2"
                )}
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
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <div className="text-lg font-semibold">{status}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  P1
                </div>
                <div className="truncate font-medium">
                  {playerOne?.display_name ?? "Open"}
                </div>
                <div className="text-2xl font-semibold">{state.scores.P1}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  P2
                </div>
                <div className="truncate font-medium">
                  {playerTwo?.display_name ?? "Open"}
                </div>
                <div className="text-2xl font-semibold">{state.scores.P2}</div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Turn
              </div>
              <div className="font-medium">
                {currentParticipant?.display_name ?? "Waiting"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Moves
                </div>
                <div className="font-medium">{state.moves}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Difficulty
                </div>
                <div className="font-medium">{difficulty.label}</div>
              </div>
            </div>
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
  );
}
