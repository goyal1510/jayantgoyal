"use client";

import * as React from "react";
import { Check, Copy, Loader2, Share2, Users, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { cn } from "@repo/ui/lib/utils";

import { OnlineRoomHeader } from "@/components/games/online-room-header";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  JsonObject,
  OnlineSessionBundle,
} from "@/lib/games/online-sessions";
import {
  parseDareXState,
  type DareXAction,
  type DareXState,
} from "@/lib/games/dare-x";

type Participant = {
  id: string;
  display_name: string;
  seat: string;
  user_id: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed" | "abandoned";
  current_turn_participant_id: string | null;
  state: DareXState | JsonObject;
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

export function OnlineDareXRoom({ roomCode }: { roomCode: string }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [displayName, setDisplayName] = React.useState("Player");
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [submittingAction, setSubmittingAction] =
    React.useState<DareXAction | null>(null);
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
      toast.error("Unable to load Dare X room");
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
      .channel(`dare-x-${session.id}`)
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

  const state = parseDareXState(session?.state);
  const me = participants.find((participant) => participant.user_id === userId);
  const currentParticipant = participants.find(
    (participant) => participant.seat === state.currentSeat,
  );
  const isMyTurn =
    session?.status === "active" &&
    me?.seat === state.currentSeat &&
    (!session.current_turn_participant_id ||
      session.current_turn_participant_id === me.id);
  const canGetDare = isMyTurn && !state.currentDare && !submittingAction;
  const canResolve = isMyTurn && !!state.currentDare && !submittingAction;

  const status =
    session?.status === "waiting"
      ? `Waiting for ${participants.length}/${session ? "room" : "players"}`
      : session?.status === "completed"
        ? "Session complete"
        : `${currentParticipant?.display_name ?? "Next player"}'s turn`;

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
      toast.error(data.error ?? "Unable to join Dare X room");
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
      `${window.location.origin}/games/dare-x/room/${roomCode}`,
    );
    toast.success("Invite link copied");
  };

  const submitAction = async (action: DareXAction) => {
    if (submittingAction) return;
    setSubmittingAction(action);
    const response = await fetch(`/api/games/dare-x/${roomCode}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setSubmittingAction(null);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to record Dare X action");
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
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden border-rose-200 bg-[radial-gradient(circle_at_top_left,#ffe4e6,transparent_32%),linear-gradient(135deg,#fff7ed,#fff1f2)] dark:border-rose-950 dark:bg-[linear-gradient(135deg,#451a03,#4c0519)]">
        <OnlineRoomHeader
          game="dare-x"
          roomCode={roomCode}
          status={status}
          onCopyInvite={copyInvite}
        />
        <CardContent className="space-y-4 pb-6">
          <div className="rounded-xl border bg-background/85 p-4">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Current player</span>
              <span>
                Turn {state.round} / {state.targetRounds}
              </span>
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {currentParticipant?.display_name ?? "Waiting"}
            </div>
          </div>

          <div className="rounded-xl border bg-background/85 p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Current dare
            </div>
            <div className="mt-3 min-h-[110px] text-xl font-semibold leading-relaxed">
              {state.currentDare ??
                (isMyTurn
                  ? "Get a dare to start your turn."
                  : "Waiting for the current player.")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void submitAction("get_dare")}
              disabled={!canGetDare}
              className="min-w-[140px] flex-1"
            >
              {submittingAction === "get_dare" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Get dare
            </Button>
            <Button
              variant="outline"
              onClick={() => void submitAction("done")}
              disabled={!canResolve}
              className="min-w-[140px] flex-1"
            >
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
            <Button
              variant="outline"
              onClick={() => void submitAction("not_done")}
              disabled={!canResolve}
              className="min-w-[140px] flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Not done
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
                <Label htmlFor="dare-room-name">Your display name</Label>
                <Input
                  id="dare-room-name"
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
            <CardTitle className="text-base">Players</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <div className="text-lg font-semibold">{status}</div>
            </div>
            {participants.map((participant) => {
              const completed = state.completed[participant.seat] ?? {
                done: [],
                skipped: [],
              };
              return (
                <div
                  key={participant.id}
                  className={cn(
                    "rounded-lg border p-3",
                    participant.seat === state.currentSeat &&
                      "border-rose-400 bg-rose-500/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate font-medium">
                      {participant.display_name}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {participant.seat}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{completed.done.length} done</span>
                    <span>{completed.skipped.length} skipped</span>
                  </div>
                </div>
              );
            })}
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
