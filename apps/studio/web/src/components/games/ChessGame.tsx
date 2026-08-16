"use client";

import * as React from "react";
import { Chess } from "chess.js";
import { useRouter } from "next/navigation";
import { Globe2, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@jayant/web-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@jayant/web-ui/card";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import { cn } from "@jayant/web-ui/lib/utils";

import { GameSetupSheet } from "@/components/games/game-setup-sheet";
import {
  CHESS_PIECES,
  createChessState,
  getChessCompletion,
  type ChessSquare,
} from "@/lib/games/chess";

function ChessBoard({
  chess,
  selected,
  legalTargets,
  onSquareClick,
}: {
  chess: Chess;
  selected: ChessSquare | null;
  legalTargets: Set<string>;
  onSquareClick: (square: ChessSquare) => void;
}) {
  const board = chess.board();

  return (
    <div className="grid aspect-square w-full max-w-[min(86vw,620px)] grid-cols-8 overflow-hidden rounded-xl border border-stone-950/20 bg-stone-900 shadow-2xl shadow-stone-950/20">
      {board.flat().map((piece, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const file = "abcdefgh"[col]!;
        const rank = String(8 - row);
        const square = `${file}${rank}` as ChessSquare;
        const light = (row + col) % 2 === 0;
        const isSelected = selected === square;
        const isLegal = legalTargets.has(square);

        return (
          <button
            key={square}
            type="button"
            onClick={() => onSquareClick(square)}
            className={cn(
              "relative flex items-center justify-center text-3xl font-semibold transition sm:text-5xl",
              light ? "bg-[#e8d7b2]" : "bg-[#8b5f3c]",
              isSelected && "ring-4 ring-amber-400 ring-inset",
              isLegal &&
                "after:absolute after:h-4 after:w-4 after:rounded-full after:bg-emerald-500/70 sm:after:h-5 sm:after:w-5",
            )}
            aria-label={square}
          >
            <span
              className={
                piece?.color === "w"
                  ? "text-stone-50 drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]"
                  : "text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]"
              }
            >
              {piece ? CHESS_PIECES[`${piece.color}${piece.type}`] : ""}
            </span>
            {(row === 7 || col === 0) && (
              <span className="absolute bottom-1 left-1 text-[10px] font-bold text-black/45">
                {col === 0 ? rank : ""}
                {row === 7 ? file : ""}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ChessGame() {
  const router = useRouter();
  const [chess, setChess] = React.useState(() => new Chess());
  const [selected, setSelected] = React.useState<ChessSquare | null>(null);
  const [lastSan, setLastSan] = React.useState<string | null>(null);
  const [onlineName, setOnlineName] = React.useState("White Player");
  const [joinCode, setJoinCode] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [showOnlineSetup, setShowOnlineSetup] = React.useState(false);

  const legalTargets = React.useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(
      chess.moves({ square: selected, verbose: true }).map((move) => move.to),
    );
  }, [chess, selected]);

  const reset = () => {
    setChess(new Chess());
    setSelected(null);
    setLastSan(null);
  };

  const onSquareClick = (square: ChessSquare) => {
    const piece = chess.get(square);

    if (!selected) {
      if (piece?.color === chess.turn()) setSelected(square);
      return;
    }

    if (selected === square) {
      setSelected(null);
      return;
    }

    const next = new Chess(chess.fen());
    const move = (() => {
      try {
        return next.move({ from: selected, to: square, promotion: "q" });
      } catch {
        return null;
      }
    })();

    if (!move) {
      if (piece?.color === chess.turn()) setSelected(square);
      return;
    }

    setChess(next);
    setLastSan(move.san);
    setSelected(null);
  };

  const createOnlineRoom = async () => {
    setCreating(true);
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "chess",
        displayName: onlineName,
        settings: { initialState: createChessState(new Chess()) },
      }),
    });
    setCreating(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to create chess room");
      return;
    }

    const data = await response.json();
    const roomCode = data?.session?.session?.room_code;
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned");
      return;
    }

    router.push(`/games/chess/room/${roomCode}`);
  };

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code");
      return;
    }
    router.push(`/games/chess/room/${roomCode}`);
  };

  const status = getChessCompletion(chess, null)
    ? chess.isCheckmate()
      ? "Checkmate"
      : "Draw"
    : chess.inCheck()
      ? "Check"
      : `${chess.turn() === "w" ? "White" : "Black"} to move`;

  return (
    <>
      <Card className="overflow-hidden rounded-[1.75rem] border-border/80 bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 p-5 sm:p-6">
          <div>
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
              Local board
            </p>
            <CardTitle className="mt-1 text-2xl tracking-[-0.035em]">
              {status}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnlineSetup(true)}
            >
              <Globe2 className="mr-2 size-4" />
              Play online
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset board
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid items-start gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex justify-center rounded-[1.5rem] bg-muted/25 p-3 sm:p-5">
            <ChessBoard
              chess={chess}
              selected={selected}
              legalTargets={legalTargets}
              onSquareClick={onSquareClick}
            />
          </div>

          <aside className="space-y-3 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4 text-sm">
            <p className="font-semibold">Match details</p>
            <div className="rounded-xl border border-border/70 bg-background p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <div className="text-lg font-semibold">{status}</div>
            </div>
            <div className="rounded-xl border border-border/70 bg-background p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Last move
              </div>
              <div className="font-mono text-lg">{lastSan ?? "—"}</div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Select one of the current player&apos;s pieces to reveal legal
              moves.
            </p>
          </aside>
        </CardContent>
      </Card>

      <GameSetupSheet
        open={showOnlineSetup}
        onOpenChange={setShowOnlineSetup}
        title="Play Chess online"
        description="Create a new table or join a room using its code."
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOnlineSetup(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={createOnlineRoom}
              disabled={creating}
              className="flex-[1.35]"
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create table"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="chess-online-name">Your display name</Label>
            <Input
              id="chess-online-name"
              value={onlineName}
              onChange={(event) => setOnlineName(event.target.value)}
            />
          </div>
          <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/25 p-4">
            <Label htmlFor="chess-room-code">Already have a room?</Label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                id="chess-room-code"
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(event.target.value.toUpperCase())
                }
                placeholder="Room code"
                maxLength={10}
              />
              <Button variant="outline" onClick={joinOnlineRoom}>
                Join table
              </Button>
            </div>
          </div>
        </div>
      </GameSetupSheet>
    </>
  );
}
