"use client";

import * as React from "react";
import { Chess } from "chess.js";
import { Copy, Loader2, Share2, Users } from "lucide-react";
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
  CHESS_PIECES,
  parseChessState,
  seatToColor,
  type ChessSquare,
  type ChessState,
} from "@/lib/games/chess";

type Participant = {
  id: string;
  display_name: string;
  seat: "W" | "B";
  user_id: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed" | "abandoned";
  current_turn_participant_id: string | null;
  winner_participant_id: string | null;
  state: ChessState | JsonObject;
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

function ChessBoard({
  chess,
  selected,
  legalTargets,
  lastMove,
  orientation,
  disabled,
  onSquareClick,
}: {
  chess: Chess;
  selected: ChessSquare | null;
  legalTargets: Set<string>;
  lastMove: ChessState["lastMove"];
  orientation: "w" | "b";
  disabled: boolean;
  onSquareClick: (square: ChessSquare) => void;
}) {
  const board = chess.board();
  const rows =
    orientation === "w"
      ? board
      : [...board].reverse().map((row) => [...row].reverse());

  return (
    <div className="grid aspect-square w-full max-w-[min(88vw,640px)] grid-cols-8 overflow-hidden rounded-xl border border-stone-950/20 bg-stone-900 shadow-2xl shadow-stone-950/25">
      {rows.flat().map((piece, index) => {
        const visualRow = Math.floor(index / 8);
        const visualCol = index % 8;
        const row = orientation === "w" ? visualRow : 7 - visualRow;
        const col = orientation === "w" ? visualCol : 7 - visualCol;
        const file = "abcdefgh"[col]!;
        const rank = String(8 - row);
        const square = `${file}${rank}` as ChessSquare;
        const light = (row + col) % 2 === 0;
        const isSelected = selected === square;
        const isLegal = legalTargets.has(square);
        const isLastMove = lastMove?.from === square || lastMove?.to === square;

        return (
          <button
            key={square}
            type="button"
            disabled={disabled}
            onClick={() => onSquareClick(square)}
            className={cn(
              "relative flex items-center justify-center text-3xl font-semibold transition sm:text-5xl",
              light ? "bg-[#e8d7b2]" : "bg-[#8b5f3c]",
              !disabled && "hover:brightness-110",
              isSelected && "ring-4 ring-amber-400 ring-inset",
              isLastMove &&
                "after:absolute after:inset-0 after:bg-amber-300/28",
              isLegal &&
                "before:absolute before:h-4 before:w-4 before:rounded-full before:bg-emerald-500/75 sm:before:h-5 sm:before:w-5",
            )}
            aria-label={square}
          >
            <span
              className={cn(
                "relative z-10",
                piece?.color === "w"
                  ? "text-stone-50 drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]"
                  : "text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]",
              )}
            >
              {piece ? CHESS_PIECES[`${piece.color}${piece.type}`] : ""}
            </span>
            {(visualRow === 7 || visualCol === 0) && (
              <span className="absolute bottom-1 left-1 z-10 text-[10px] font-bold text-black/45">
                {visualCol === 0 ? rank : ""}
                {visualRow === 7 ? file : ""}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function OnlineChessRoom({ roomCode }: { roomCode: string }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [displayName, setDisplayName] = React.useState("Player");
  const [selected, setSelected] = React.useState<ChessSquare | null>(null);
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
      toast.error("Unable to load chess room");
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
      .channel(`chess-${session.id}`)
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

  const state = parseChessState(session?.state);
  const chess = React.useMemo(() => new Chess(state.fen), [state.fen]);
  const white = participants.find((participant) => participant.seat === "W");
  const black = participants.find((participant) => participant.seat === "B");
  const me = participants.find((participant) => participant.user_id === userId);
  const myColor = seatToColor(me?.seat);
  const currentParticipant = participants.find(
    (participant) => seatToColor(participant.seat) === chess.turn(),
  );
  const isMyTurn =
    session?.status === "active" &&
    myColor === chess.turn() &&
    (!session.current_turn_participant_id ||
      session.current_turn_participant_id === me?.id);
  const disabledBoard =
    !isMyTurn || submittingMove || session?.status !== "active";

  const legalTargets = React.useMemo(() => {
    if (!selected || !isMyTurn) return new Set<string>();
    return new Set(
      chess.moves({ square: selected, verbose: true }).map((move) => move.to),
    );
  }, [chess, isMyTurn, selected]);

  const status =
    session?.status === "waiting"
      ? "Waiting for black"
      : session?.status === "completed"
        ? chess.isCheckmate()
          ? "Checkmate"
          : "Draw"
        : chess.inCheck()
          ? `${chess.turn() === "w" ? "White" : "Black"} in check`
          : `${chess.turn() === "w" ? "White" : "Black"} to move`;

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
      toast.error(data.error ?? "Unable to join chess room");
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
      `${window.location.origin}/games/chess/room/${roomCode}`,
    );
    toast.success("Invite link copied");
  };

  const submitMove = async (from: ChessSquare, to: ChessSquare) => {
    setSubmittingMove(true);
    const response = await fetch(`/api/games/chess/${roomCode}/moves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movePayload: { from, to, promotion: "q" } }),
    });
    setSubmittingMove(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to record chess move");
      return;
    }

    const data = (await response.json()) as {
      session: OnlineSessionBundle | null;
    };
    const bundle = coerceBundle(data.session);
    setSession(bundle.session);
    setParticipants(bundle.participants);
  };

  const onSquareClick = (square: ChessSquare) => {
    if (!isMyTurn || disabledBoard) return;
    const piece = chess.get(square);

    if (!selected) {
      if (piece?.color === myColor) setSelected(square);
      return;
    }

    if (selected === square) {
      setSelected(null);
      return;
    }

    if (!legalTargets.has(square)) {
      if (piece?.color === myColor) setSelected(square);
      return;
    }

    const from = selected;
    setSelected(null);
    void submitMove(from, square);
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden border-stone-200 bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_34%),linear-gradient(135deg,#fafaf9,#f5f5f4)] dark:border-stone-800 dark:bg-[linear-gradient(135deg,#1c1917,#0c0a09)]">
        <OnlineRoomHeader
          game="chess"
          roomCode={roomCode}
          status={status}
          onCopyInvite={copyInvite}
        />
        <CardContent className="flex justify-center pb-6">
          <ChessBoard
            chess={chess}
            selected={selected}
            legalTargets={legalTargets}
            lastMove={state.lastMove}
            orientation={myColor ?? "w"}
            disabled={disabledBoard}
            onSquareClick={onSquareClick}
          />
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
                <Label htmlFor="chess-room-name">Your display name</Label>
                <Input
                  id="chess-room-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <Button onClick={joinRoom} disabled={joining} className="w-full">
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join as black"
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
                  White
                </div>
                <div className="truncate font-medium">
                  {white?.display_name ?? "Open"}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Black
                </div>
                <div className="truncate font-medium">
                  {black?.display_name ?? "Open"}
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
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Last move
              </div>
              <div className="font-mono text-lg">
                {state.lastMove?.san ?? "—"}
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
