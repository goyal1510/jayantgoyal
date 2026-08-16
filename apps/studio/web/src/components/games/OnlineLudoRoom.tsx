"use client";

import * as React from "react";
import { Copy, Loader2, Share2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@jayant/web-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@jayant/web-ui/card";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import { cn } from "@jayant/web-ui/lib/utils";

import { OnlineRoomHeader } from "@/components/games/online-room-header";
import {
  LUDO_TOKEN_CLASSES,
  OnlineLudoBoard,
} from "@/components/games/online-ludo-board";
import type {
  JsonObject,
  OnlineSessionBundle,
} from "@/lib/games/online-sessions";
import {
  getFinishedLudoTokenCount,
  getLegalLudoMoves,
  LUDO_SEAT_META,
  parseLudoState,
  type LudoSeat,
  type LudoState,
} from "@/lib/games/ludo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Participant = {
  id: string;
  display_name: string;
  seat: LudoSeat;
  user_id: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed" | "abandoned";
  current_turn_participant_id: string | null;
  state: LudoState | JsonObject;
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

/** Coordinate room state, realtime updates and player actions around the Ludo board. */
export function OnlineLudoRoom({ roomCode }: { roomCode: string }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [displayName, setDisplayName] = React.useState("Player");
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [submittingAction, setSubmittingAction] = React.useState(false);
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
      toast.error("Unable to load Ludo room");
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
      .channel(`ludo-${session.id}`)
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

  const state = parseLudoState(session?.state);
  const me = participants.find((participant) => participant.user_id === userId);
  const currentParticipant = participants.find(
    (participant) => participant.seat === state.currentSeat,
  );
  const legalTokenIds = me ? getLegalLudoMoves(state, me.seat) : [];
  const isMyTurn =
    session?.status === "active" &&
    me?.seat === state.currentSeat &&
    (!session.current_turn_participant_id ||
      session.current_turn_participant_id === me.id);
  const status =
    session?.status === "waiting"
      ? `Waiting for ${state.activeSeats.length - participants.length} player${state.activeSeats.length - participants.length === 1 ? "" : "s"}`
      : state.winner
        ? `${LUDO_SEAT_META[state.winner].label} wins`
        : `${LUDO_SEAT_META[state.currentSeat].label} to ${state.phase}`;

  const submitAction = async (actionPayload: JsonObject) => {
    if (submittingAction) return;
    setSubmittingAction(true);
    const response = await fetch(`/api/games/ludo/${roomCode}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionPayload }),
    });
    setSubmittingAction(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to update Ludo room");
      return;
    }

    const data = (await response.json()) as {
      session: OnlineSessionBundle | null;
    };
    const bundle = coerceBundle(data.session);
    setSession(bundle.session);
    setParticipants(bundle.participants);
  };

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
      toast.error(data.error ?? "Unable to join Ludo room");
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
      `${window.location.origin}/games/ludo/room/${roomCode}`,
    );
    toast.success("Invite link copied");
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
      <Card className="overflow-hidden border-rose-200 bg-[radial-gradient(circle_at_top_left,#ffe4e6,transparent_34%),linear-gradient(135deg,#fff7ed,#fff1f2)] dark:border-rose-900/70 dark:bg-[linear-gradient(135deg,#111827,#4c0519)]">
        <OnlineRoomHeader
          game="ludo"
          roomCode={roomCode}
          status={status}
          onCopyInvite={copyInvite}
        />
        <CardContent className="space-y-4 pb-6">
          <OnlineLudoBoard
            state={state}
            isMyTurn={isMyTurn}
            legalTokenIds={legalTokenIds}
            submittingAction={submittingAction}
            submitAction={submitAction}
          />
          <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-xl border bg-background/80 p-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-white text-3xl font-black text-zinc-950 shadow-sm">
              {state.diceValue ?? state.lastMove?.diceValue ?? "-"}
            </div>
            <Button
              onClick={() => void submitAction({ action: "roll" })}
              disabled={
                !isMyTurn ||
                state.phase !== "roll" ||
                submittingAction ||
                session?.status !== "active"
              }
              className="min-w-32"
            >
              {submittingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Roll"
              )}
            </Button>
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
                <Input
                  id="ludo-room-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <Button onClick={joinRoom} disabled={joining} className="w-full">
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join room"
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
              <div className="text-xs text-muted-foreground">
                Turn {state.turnNumber} · Target {state.targetTokens}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {state.activeSeats.map((seat) => {
                const participant = participants.find(
                  (item) => item.seat === seat,
                );
                const isCurrent =
                  state.currentSeat === seat && session?.status !== "completed";
                return (
                  <div
                    key={seat}
                    className={cn(
                      "rounded-lg border p-3",
                      isCurrent && "ring-2 ring-rose-400",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {LUDO_SEAT_META[seat].label}
                      </div>
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full",
                          LUDO_TOKEN_CLASSES[seat],
                        )}
                      />
                    </div>
                    <div className="truncate font-medium">
                      {participant?.display_name ?? "Open"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Home {getFinishedLudoTokenCount(state, seat)}/
                      {state.targetTokens}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Current player
              </div>
              <div className="font-medium">
                {currentParticipant?.display_name ?? "Waiting"}
              </div>
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
  );
}
