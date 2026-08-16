"use client";

import * as React from "react";
import { Copy, Loader2, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";
import { cn } from "@jayantgoyal/web-ui/lib/utils";

import { OnlineRoomHeader } from "@/components/games/online-room-header";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  JsonObject,
  OnlineSessionBundle,
} from "@/lib/games/online-sessions";
import {
  parseTicTacToeState,
  type TicTacToeState,
} from "@/lib/games/tic-tac-toe";

type Participant = {
  id: string;
  display_name: string;
  seat: "X" | "O";
  user_id: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed" | "abandoned";
  current_turn_participant_id: string | null;
  winner_participant_id: string | null;
  state: TicTacToeState | JsonObject;
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

export function OnlineTicTacToeRoom({ roomCode }: { roomCode: string }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [displayName, setDisplayName] = React.useState("Player");
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [submittingMove, setSubmittingMove] = React.useState(false);
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
      toast.error("Unable to load Tic Tac Toe room");
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
      .channel(`tic-tac-toe-${session.id}`)
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

  const state = parseTicTacToeState(session?.state);
  const playerX = participants.find((participant) => participant.seat === "X");
  const playerO = participants.find((participant) => participant.seat === "O");
  const me = participants.find((participant) => participant.user_id === userId);
  const currentParticipant = participants.find(
    (participant) => participant.seat === state.currentPlayer,
  );
  const isMyTurn =
    session?.status === "active" &&
    me?.seat === state.currentPlayer &&
    (!session.current_turn_participant_id ||
      session.current_turn_participant_id === me.id);

  const status =
    session?.status === "waiting"
      ? "Waiting for O"
      : state.winner
        ? `${state.winner} wins`
        : state.isDraw
          ? "Draw"
          : `${state.currentPlayer} to move`;

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
      toast.error(data.error ?? "Unable to join Tic Tac Toe room");
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
      `${window.location.origin}/games/tic-tac-toe/room/${roomCode}`,
    );
    toast.success("Invite link copied");
  };

  const submitMove = async (cell: number) => {
    if (
      !isMyTurn ||
      state.board[cell] ||
      state.winner ||
      state.isDraw ||
      submittingMove
    )
      return;

    setSubmittingMove(true);
    const response = await fetch(`/api/games/tic-tac-toe/${roomCode}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movePayload: { cell } }),
    });
    setSubmittingMove(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to record move");
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
      <Card className="overflow-hidden border-sky-200 bg-[radial-gradient(circle_at_top_left,#e0f2fe,transparent_32%),linear-gradient(135deg,#f8fafc,#eff6ff)] dark:border-sky-900/70 dark:bg-[linear-gradient(135deg,#0f172a,#082f49)]">
        <OnlineRoomHeader
          game="tic-tac-toe"
          roomCode={roomCode}
          status={status}
          onCopyInvite={copyInvite}
        />
        <CardContent className="flex justify-center pb-6">
          <div className="grid w-full max-w-[min(86vw,500px)] grid-cols-3 gap-2">
            {state.board.map((cell, index) => (
              <button
                key={index}
                type="button"
                onClick={() => void submitMove(index)}
                disabled={
                  !isMyTurn ||
                  !!cell ||
                  !!state.winner ||
                  state.isDraw ||
                  submittingMove
                }
                className={cn(
                  "aspect-square rounded-xl border bg-background/90 text-5xl font-black transition sm:text-7xl",
                  "disabled:cursor-not-allowed disabled:opacity-85",
                  isMyTurn &&
                    !cell &&
                    !state.winner &&
                    !state.isDraw &&
                    "hover:-translate-y-0.5 hover:bg-sky-50 dark:hover:bg-sky-950",
                  state.winningLine.includes(index) &&
                    "border-emerald-500 bg-emerald-100 text-emerald-700 dark:bg-emerald-950",
                )}
                aria-label={`cell ${index + 1}`}
              >
                {cell}
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
                <Label htmlFor="tic-room-name">Your display name</Label>
                <Input
                  id="tic-room-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <Button onClick={joinRoom} disabled={joining} className="w-full">
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join as O"
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
                  X
                </div>
                <div className="truncate font-medium">
                  {playerX?.display_name ?? "Open"}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  O
                </div>
                <div className="truncate font-medium">
                  {playerO?.display_name ?? "Open"}
                </div>
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
