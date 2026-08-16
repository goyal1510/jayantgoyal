"use client";

import { useState } from "react";
import {
  Bot,
  Loader2,
  Globe2,
  RefreshCcw,
  Settings,
  Square,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayant/web-ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@jayant/web-ui/card";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import { cn } from "@jayant/web-ui/lib/utils";

import {
  GameSetupPathPicker,
  GameSetupSheet,
  type GameSetupPath,
} from "@/components/games/game-setup-sheet";
import { useTicTacToe } from "@/components/games/use-tic-tac-toe";
import { EMPTY_TIC_TAC_TOE_STATE } from "@/lib/games/tic-tac-toe";

export function TicTacToe() {
  const router = useRouter();
  const {
    mode,
    setMode,
    board,
    winner,
    isDraw,
    isLoading,
    showSetupSheet,
    setShowSetupSheet,
    playerO,
    setPlayerO,
    playerX,
    setPlayerX,
    moveHistory,
    playerLabels,
    resetBoard,
    startSession,
    handleBoxClick,
  } = useTicTacToe();
  const [setupPath, setSetupPath] = useState<GameSetupPath>("local");
  const [onlineName, setOnlineName] = useState("Player X");
  const [joinCode, setJoinCode] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  const createOnlineRoom = async () => {
    setCreatingRoom(true);
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "tic-tac-toe",
        displayName: onlineName,
        settings: { initialState: EMPTY_TIC_TAC_TOE_STATE },
      }),
    });
    setCreatingRoom(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to create Tic Tac Toe room");
      return;
    }

    const data = await response.json();
    const roomCode = data?.session?.session?.room_code;
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned");
      return;
    }

    router.push(`/games/tic-tac-toe/room/${roomCode}`);
  };

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code");
      return;
    }
    router.push(`/games/tic-tac-toe/room/${roomCode}`);
  };

  const selectSetupPath = (path: GameSetupPath) => {
    setSetupPath(path);
    if (path !== "online") {
      setMode(path === "computer" ? "vs_computer" : "local_pvp");
    }
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[1.75rem] border-border/80 bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 p-5 sm:p-6">
          <div>
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
              Current match
            </p>
            <CardTitle className="mt-1 text-2xl tracking-[-0.035em]">
              {winner
                ? "Match complete"
                : isDraw
                  ? "Draw"
                  : playerLabels.current}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSetupSheet(true)}
              disabled={isLoading}
            >
              <Settings className="mr-2 h-4 w-4" />
              Setup
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetBoard}
              disabled={isLoading}
            >
              <span className="sr-only">Reset board</span>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid items-start gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">
                  {winner
                    ? `Winner: ${winner === "O" ? playerO : playerX}`
                    : isDraw
                      ? "Game Draw"
                      : `Turn: ${playerLabels.current}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {playerLabels.modeLabel} · {playerO} (O) vs {playerX} (X)
                </div>
              </div>
            </div>

            <div className="flex justify-center rounded-[1.5rem] bg-[#ff5a4f]/10 p-4 sm:p-6">
              <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:gap-3">
                {board.map((value, index) => (
                  <button
                    key={index}
                    onClick={() => handleBoxClick(index)}
                    disabled={!!value || !!winner || isDraw || isLoading}
                    aria-label={
                      value
                        ? `Cell ${index + 1}: ${value}`
                        : `Play cell ${index + 1}`
                    }
                    className={cn(
                      "flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 border-border/80 bg-background text-4xl font-semibold transition hover:-translate-y-0.5 hover:border-[#d93328] hover:bg-[#fff8ef] sm:text-5xl",
                      "disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0",
                      value === "O" && "text-[#d93328]",
                      value === "X" && "text-[#6f4aa8]",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex h-full min-h-[22rem] flex-col space-y-3 rounded-[1.5rem] border border-border/70 bg-muted/25 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Move history</div>
              <div className="text-xs text-muted-foreground">
                {moveHistory.length} move{moveHistory.length === 1 ? "" : "s"}
              </div>
            </div>
            {moveHistory.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Square className="size-5" />
                Your moves will appear here.
              </div>
            ) : (
              <div className="space-y-2 flex-1 max-h-[480px] overflow-y-auto pr-1 text-sm">
                {moveHistory.map((move, idx) => (
                  <div
                    key={move.id}
                    className="flex items-center justify-between rounded-md border bg-background p-2"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground">
                        Move {moveHistory.length - idx} ·{" "}
                        {new Date(move.at).toLocaleTimeString()}
                      </div>
                      <div className="font-medium">{move.playerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {move.symbol} to cell {move.cell + 1}
                      </div>
                    </div>
                    <Square className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <GameSetupSheet
        open={showSetupSheet}
        onOpenChange={setShowSetupSheet}
        title="Set up Tic Tac Toe"
        description="Choose one way to play. Your primary action stays visible while you configure the match."
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSetupSheet(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={
                setupPath === "online"
                  ? createOnlineRoom
                  : () => startSession(mode)
              }
              disabled={isLoading || creatingRoom}
              className="flex-[1.35]"
            >
              {isLoading || creatingRoom ? (
                <Loader2 className="size-4 animate-spin" />
              ) : setupPath === "online" ? (
                "Create room"
              ) : setupPath === "computer" ? (
                "Play computer"
              ) : (
                "Start local match"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-7">
          <section className="space-y-3">
            <Label className="text-sm font-semibold">
              How do you want to play?
            </Label>
            <GameSetupPathPicker
              value={setupPath}
              onValueChange={selectSetupPath}
              options={[
                {
                  value: "local",
                  label: "Local",
                  description: "Two players, one device.",
                  icon: <Users className="size-4" />,
                },
                {
                  value: "computer",
                  label: "Computer",
                  description: "Play a solo round.",
                  icon: <Bot className="size-4" />,
                },
                {
                  value: "online",
                  label: "Online",
                  description: "Create or join a room.",
                  icon: <Globe2 className="size-4" />,
                },
              ]}
            />
          </section>

          {setupPath === "online" ? (
            <section className="space-y-5 rounded-2xl border border-border/70 bg-muted/25 p-4">
              <div className="space-y-2">
                <Label htmlFor="tic-online-name">Your display name</Label>
                <Input
                  id="tic-online-name"
                  value={onlineName}
                  onChange={(event) => setOnlineName(event.target.value)}
                />
              </div>
              <div className="space-y-2 border-t border-border/70 pt-4">
                <Label htmlFor="tic-room-code">Already have a room?</Label>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    id="tic-room-code"
                    value={joinCode}
                    onChange={(event) =>
                      setJoinCode(event.target.value.toUpperCase())
                    }
                    placeholder="Room code"
                    maxLength={10}
                  />
                  <Button variant="outline" onClick={joinOnlineRoom}>
                    Join room
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div>
                <h3 className="font-semibold">Player names</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {setupPath === "computer"
                    ? "You play as O. The computer takes X."
                    : "Choose the names shown during this match."}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tic-player-o">Player O</Label>
                  <Input
                    id="tic-player-o"
                    value={playerO}
                    onChange={(event) => setPlayerO(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tic-player-x">Player X</Label>
                  <Input
                    id="tic-player-x"
                    value={playerX}
                    onChange={(event) => setPlayerX(event.target.value)}
                    disabled={setupPath === "computer"}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </GameSetupSheet>
    </>
  );
}
