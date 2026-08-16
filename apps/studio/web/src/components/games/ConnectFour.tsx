"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  Bot,
  Loader2,
  RefreshCcw,
  Settings,
  Circle,
  Users,
  Globe2,
} from "lucide-react";
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

import {
  GameSetupPathPicker,
  GameSetupSheet,
  type GameSetupPath,
} from "@/components/games/game-setup-sheet";
import {
  useConnectFour,
  ROWS,
  COLS,
} from "@/components/games/use-connect-four";

export function ConnectFour() {
  const router = useRouter();
  const {
    mode,
    setMode,
    board,
    currentPlayer,
    winner,
    isDraw,
    isLoading,
    showSetupSheet,
    setShowSetupSheet,
    playerR,
    setPlayerR,
    playerY,
    setPlayerY,
    lastMove,
    winningLine,
    animatingCell,
    isProcessingMove,
    playerLabels,
    resetBoard,
    startSession,
    handleColumnClick,
  } = useConnectFour();
  const [setupPath, setSetupPath] = useState<GameSetupPath>("local");
  const [onlineName, setOnlineName] = useState("Player Red");
  const [joinCode, setJoinCode] = useState("");
  const [isCreatingOnlineRoom, setIsCreatingOnlineRoom] = useState(false);

  const createOnlineRoom = async () => {
    setIsCreatingOnlineRoom(true);
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "connect-four",
        displayName: onlineName,
      }),
    });
    setIsCreatingOnlineRoom(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to create online room");
      return;
    }

    const data = await response.json();
    const roomCode = data?.session?.session?.room_code;
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned");
      return;
    }

    router.push(`/games/connect-four/room/${roomCode}`);
  };

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code");
      return;
    }
    router.push(`/games/connect-four/room/${roomCode}`);
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
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div
            className={cn(
              "rounded-2xl border p-4 transition-colors",
              winner
                ? "border-emerald-400 bg-emerald-100 dark:bg-emerald-900/20"
                : "border-border/70 bg-muted/25",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className={cn(
                  "text-sm font-semibold",
                  winner && "text-green-700 dark:text-green-400",
                )}
              >
                {winner
                  ? `Winner: ${winner === "R" ? playerR : playerY}`
                  : isDraw
                    ? "Game Draw"
                    : `Turn: ${playerLabels.current}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {playerLabels.modeLabel} · {playerR} (Red) vs {playerY} (Yellow)
                {winningLine.length > 0 &&
                  ` · ${winningLine.length} winning cells`}
              </div>
            </div>
          </div>

          <div className="flex justify-center rounded-[1.5rem] bg-[#f2e2c8]/70 p-3 sm:p-6 dark:bg-[#332d28]">
            <div className="inline-block rounded-[1.5rem] border-4 border-[#315fb5] bg-[#4b7fea] p-2 shadow-lg shadow-[#315fb5]/20">
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {Array.from({ length: COLS }).map((_, col) => (
                  <div key={col} className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full mb-1"
                      onClick={() => handleColumnClick(col)}
                      disabled={
                        !!winner ||
                        !!isDraw ||
                        isLoading ||
                        isProcessingMove ||
                        (mode === "vs_computer" && currentPlayer === "Y")
                      }
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <div className="relative">
                      {Array.from({ length: ROWS }).map((_, row) => {
                        const cell = board[row]![col]!;
                        const isLastMove =
                          lastMove?.row === row && lastMove?.col === col;
                        const isWinning = winningLine.some(
                          (w) => w.row === row && w.col === col,
                        );
                        return (
                          <div
                            key={`${row}-${col}`}
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all relative",
                              cell === "R" && "bg-red-500 border-red-600",
                              cell === "Y" && "bg-yellow-400 border-yellow-500",
                              cell === "" &&
                                "bg-[#fff8ef] border-[#315fb5] dark:bg-[#202124] dark:border-[#6d8fd4]",
                              isLastMove &&
                                "ring-4 ring-blue-400 ring-offset-2",
                              isWinning &&
                                "ring-4 ring-green-400 ring-offset-2 animate-pulse",
                            )}
                          >
                            {cell === "R" && (
                              <Circle
                                className="h-6 w-6 sm:h-8 sm:w-8 text-red-700"
                                fill="currentColor"
                              />
                            )}
                            {cell === "Y" && (
                              <Circle
                                className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600"
                                fill="currentColor"
                              />
                            )}
                          </div>
                        );
                      })}
                      {animatingCell && animatingCell.col === col && (
                        <div
                          className={cn(
                            "absolute left-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center z-10",
                            currentPlayer === "R" &&
                              "bg-red-500 border-red-600",
                            currentPlayer === "Y" &&
                              "bg-yellow-400 border-yellow-500",
                            "coin-drop-animation",
                          )}
                          style={{
                            top: `calc(${animatingCell.row} * (100% / ${ROWS}))`,
                          }}
                        >
                          <Circle
                            className={cn(
                              "h-6 w-6 sm:h-8 sm:w-8",
                              currentPlayer === "R"
                                ? "text-red-700"
                                : "text-yellow-600",
                            )}
                            fill="currentColor"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Computer is thinking...
            </div>
          )}
        </CardContent>
      </Card>

      <GameSetupSheet
        open={showSetupSheet}
        onOpenChange={setShowSetupSheet}
        title="Set up Connect Four"
        description="Choose one match type, then configure only the settings it needs."
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
              disabled={isLoading || isCreatingOnlineRoom}
              className="flex-[1.35]"
            >
              {isLoading || isCreatingOnlineRoom ? (
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
                  description: "You play as Red.",
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
                <Label htmlFor="connect-online-name">Your display name</Label>
                <Input
                  id="connect-online-name"
                  value={onlineName}
                  onChange={(event) => setOnlineName(event.target.value)}
                />
              </div>
              <div className="space-y-2 border-t border-border/70 pt-4">
                <Label htmlFor="connect-room-code">Already have a room?</Label>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    id="connect-room-code"
                    value={joinCode}
                    onChange={(event) =>
                      setJoinCode(event.target.value.toUpperCase())
                    }
                    placeholder="Room code"
                    maxLength={10}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={joinOnlineRoom}
                  >
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
                    ? "You play as Red. The computer takes Yellow."
                    : "Choose the names shown during this match."}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="connect-player-red">Red</Label>
                  <Input
                    id="connect-player-red"
                    value={playerR}
                    onChange={(event) => setPlayerR(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connect-player-yellow">Yellow</Label>
                  <Input
                    id="connect-player-yellow"
                    value={playerY}
                    onChange={(event) => setPlayerY(event.target.value)}
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
