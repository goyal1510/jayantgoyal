"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Circle, Loader2, LogIn, RefreshCcw, Share2 } from "lucide-react";
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
  checkWinner,
  COLS,
  createEmptyConnectFourBoard,
  getAvailableRow,
  isBoardFull,
  ROWS,
  type Cell,
} from "@/components/games/use-connect-four";

type Participant = {
  id: string;
  display_name: string;
  seat: "R" | "Y";
  user_id: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed" | "abandoned";
  current_turn_participant_id: string | null;
  state: ConnectFourOnlineState | JsonObject;
};

type ConnectFourOnlineState = {
  board: Cell[][];
  currentPlayer: "R" | "Y";
  winner: "R" | "Y" | null;
  isDraw: boolean;
  lastMove: { row: number; col: number } | null;
  winningLine: Array<{ row: number; col: number }>;
};

const EMPTY_STATE: ConnectFourOnlineState = {
  board: createEmptyConnectFourBoard(),
  currentPlayer: "R",
  winner: null,
  isDraw: false,
  lastMove: null,
  winningLine: [],
};

function parseState(value: unknown): ConnectFourOnlineState {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return EMPTY_STATE;
  const state = value as Partial<ConnectFourOnlineState>;
  return {
    board: Array.isArray(state.board) ? state.board : EMPTY_STATE.board,
    currentPlayer: state.currentPlayer === "Y" ? "Y" : "R",
    winner: state.winner === "R" || state.winner === "Y" ? state.winner : null,
    isDraw: state.isDraw === true,
    lastMove: state.lastMove ?? null,
    winningLine: Array.isArray(state.winningLine) ? state.winningLine : [],
  };
}

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

export function OnlineConnectFourRoom({ roomCode }: { roomCode: string }) {
  const router = useRouter();
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
      toast.error("Unable to load room");
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
      .channel(`connect-four-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "studio",
          table: "game_sessions",
          filter: `id=eq.${session.id}`,
        },
        refreshRoom,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "studio",
          table: "game_session_participants",
          filter: `session_id=eq.${session.id}`,
        },
        refreshRoom,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "studio",
          table: "game_session_moves",
          filter: `session_id=eq.${session.id}`,
        },
        refreshRoom,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshRoom, session?.id, supabase]);

  const state = parseState(session?.state);
  const red = participants.find((participant) => participant.seat === "R");
  const yellow = participants.find((participant) => participant.seat === "Y");
  const me = participants.find((participant) => participant.user_id === userId);
  const currentParticipant = participants.find(
    (participant) => participant.seat === state.currentPlayer,
  );
  const isMyTurn =
    session?.status === "active" &&
    me?.seat === state.currentPlayer &&
    (!session.current_turn_participant_id ||
      session.current_turn_participant_id === me.id);

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
      toast.error(data.error ?? "Unable to join room");
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
      `${window.location.origin}/games/connect-four/room/${roomCode}`,
    );
    toast.success("Invite link copied");
  };

  const handleColumnClick = async (col: number) => {
    if (
      !session ||
      !me ||
      !isMyTurn ||
      state.winner ||
      state.isDraw ||
      submittingMove
    )
      return;

    const row = getAvailableRow(col, state.board);
    if (row === null) return;

    const nextBoard = state.board.map((boardRow) => [...boardRow]);
    nextBoard[row]![col] = me.seat;

    const winningLine = checkWinner(nextBoard, row, col, me.seat) ?? [];
    const winner = winningLine.length > 0 ? me.seat : null;
    const draw = !winner && isBoardFull(nextBoard);
    const nextSeat = me.seat === "R" ? "Y" : "R";
    const nextParticipant = participants.find(
      (participant) => participant.seat === nextSeat,
    );

    const resultingState: ConnectFourOnlineState = {
      board: nextBoard,
      currentPlayer: winner || draw ? me.seat : nextSeat,
      winner,
      isDraw: draw,
      lastMove: { row, col },
      winningLine,
    };

    setSubmittingMove(true);
    const response = await fetch(`/api/games/sessions/${roomCode}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movePayload: { type: "drop_disc", row, col, player: me.seat },
        resultingState,
        nextParticipantId:
          winner || draw ? null : (nextParticipant?.id ?? null),
        completion: winner
          ? { outcome: "win", winnerParticipantId: me.id, winningLine }
          : draw
            ? { outcome: "draw" }
            : undefined,
      }),
    });
    setSubmittingMove(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to record move");
      await refreshRoom();
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
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading room...
        </CardContent>
      </Card>
    );
  }

  if (needsJoin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Connect Four Room {roomCode}</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="online-display-name">Display name</Label>
            <Input
              id="online-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <Button onClick={joinRoom} disabled={joining} className="w-full">
            {joining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Join room
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/80 bg-card shadow-none">
      <OnlineRoomHeader
        game="connect-four"
        roomCode={roomCode}
        status={session?.status ?? "unknown"}
        onCopyInvite={copyInvite}
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.refresh()}
            aria-label="Refresh room"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        }
      />
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">
              {state.winner
                ? `Winner: ${state.winner === "R" ? (red?.display_name ?? "Red") : (yellow?.display_name ?? "Yellow")}`
                : state.isDraw
                  ? "Game Draw"
                  : session?.status === "waiting"
                    ? "Waiting for another player"
                    : isMyTurn
                      ? "Your turn"
                      : `Turn: ${currentParticipant?.display_name ?? state.currentPlayer}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {red?.display_name ?? "Waiting"} (Red) vs{" "}
              {yellow?.display_name ?? "Waiting"} (Yellow)
            </div>
          </div>
        </div>

        {session?.status === "waiting" && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <Share2 className="h-4 w-4" />
            Share this room link so another signed-in player can join from any
            location.
          </div>
        )}

        <div className="flex justify-center">
          <div className="inline-block rounded-lg border-4 border-blue-500 bg-blue-100 p-2 dark:bg-blue-900/20">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: COLS }).map((_, col) => (
                <div key={col} className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-1 h-8 w-full"
                    onClick={() => handleColumnClick(col)}
                    disabled={
                      !isMyTurn ||
                      !!state.winner ||
                      state.isDraw ||
                      submittingMove
                    }
                  >
                    ↓
                  </Button>
                  {Array.from({ length: ROWS }).map((_, row) => {
                    const cell = state.board[row]?.[col] ?? "";
                    const isLastMove =
                      state.lastMove?.row === row &&
                      state.lastMove?.col === col;
                    const isWinning = state.winningLine.some(
                      (winnerCell) =>
                        winnerCell.row === row && winnerCell.col === col,
                    );
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all sm:h-12 sm:w-12",
                          cell === "R" && "border-red-600 bg-red-500",
                          cell === "Y" && "border-yellow-500 bg-yellow-400",
                          cell === "" &&
                            "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800",
                          isLastMove && "ring-4 ring-blue-400 ring-offset-2",
                          isWinning &&
                            "animate-pulse ring-4 ring-green-400 ring-offset-2",
                        )}
                      >
                        {cell === "R" && (
                          <Circle
                            className="h-6 w-6 text-red-700 sm:h-8 sm:w-8"
                            fill="currentColor"
                          />
                        )}
                        {cell === "Y" && (
                          <Circle
                            className="h-6 w-6 text-yellow-600 sm:h-8 sm:w-8"
                            fill="currentColor"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {submittingMove && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving move...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
