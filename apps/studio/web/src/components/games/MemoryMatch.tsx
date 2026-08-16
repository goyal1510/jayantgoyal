"use client";

import { useState } from "react";
import {
  Bot,
  Globe2,
  Loader2,
  RefreshCcw,
  Settings,
  Trophy,
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
import {
  useMemoryMatch,
  GRID_SIZES,
} from "@/components/games/use-memory-match";
import {
  createMemoryMatchState,
  type MemoryMatchDifficulty,
} from "@/lib/games/memory-match";

export function MemoryMatch() {
  const router = useRouter();
  const {
    mode,
    setMode,
    gridSize,
    setGridSize,
    cards,
    flippedCards,
    currentPlayer,
    scores,
    isLoading,
    showSetupSheet,
    setShowSetupSheet,
    player1Name,
    setPlayer1Name,
    player2Name,
    setPlayer2Name,
    gameStarted,
    moves,
    playerLabels,
    gameOver,
    winner,
    resetGame,
    startSession,
    handleCardClick,
  } = useMemoryMatch();
  const [setupPath, setSetupPath] = useState<GameSetupPath>("local");
  const [onlineRoomCode, setOnlineRoomCode] = useState("");
  const [onlineDifficulty, setOnlineDifficulty] =
    useState<MemoryMatchDifficulty>("medium");
  const [creatingOnlineRoom, setCreatingOnlineRoom] = useState(false);
  const [joiningOnlineRoom, setJoiningOnlineRoom] = useState(false);

  const createOnlineRoom = async () => {
    setCreatingOnlineRoom(true);
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "memory-match",
        displayName: player1Name,
        settings: {
          difficulty: onlineDifficulty,
          initialState: createMemoryMatchState(onlineDifficulty),
        },
      }),
    });
    setCreatingOnlineRoom(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to create online room");
      return;
    }

    const data = await response.json();
    const roomCode = data.session?.session?.room_code;
    if (typeof roomCode === "string") {
      router.push(`/games/memory-match/room/${roomCode}`);
    }
  };

  const joinOnlineRoom = () => {
    const normalized = onlineRoomCode.trim().toUpperCase();
    if (!normalized) {
      toast.error("Enter a room code");
      return;
    }

    setJoiningOnlineRoom(true);
    router.push(`/games/memory-match/room/${normalized}`);
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
              {gameOver
                ? "Match complete"
                : gameStarted
                  ? playerLabels.current
                  : "Ready to begin"}
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
              onClick={resetGame}
              disabled={isLoading}
            >
              <span className="sr-only">Reset cards</span>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">
                {gameOver
                  ? winner
                    ? `Winner: ${winner === 1 ? player1Name : player2Name}`
                    : "It's a tie!"
                  : `Turn: ${playerLabels.current}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {playerLabels.modeLabel} · Moves: {moves}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-border/70 bg-background p-3 text-center">
              <div className="text-xs text-muted-foreground">{player1Name}</div>
              <div className="text-xl font-semibold">{scores.player1}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background p-3 text-center">
              <div className="text-xs text-muted-foreground">{player2Name}</div>
              <div className="text-xl font-semibold">{scores.player2}</div>
            </div>
          </div>

          {gameStarted && (
            <div className="flex justify-center rounded-[1.5rem] bg-muted/25 p-4 sm:p-6">
              <div
                className={cn(
                  "grid gap-2",
                  gridSize === 0 && "grid-cols-3",
                  gridSize === 1 && "grid-cols-4",
                  gridSize === 2 && "grid-cols-4",
                )}
              >
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    disabled={
                      isLoading ||
                      card.flipped ||
                      card.matched ||
                      flippedCards.length >= 2 ||
                      (mode === "vs_computer" && currentPlayer === 2) ||
                      gameOver
                    }
                    className={cn(
                      "aspect-square h-16 w-16 cursor-pointer rounded-2xl border-2 transition-all hover:-translate-y-0.5 sm:h-20 sm:w-20",
                      "disabled:cursor-not-allowed",
                      card.matched
                        ? "border-[#9daa77] bg-[#d9ddc3] dark:border-[#4b594b] dark:bg-[#29312a]"
                        : card.flipped
                          ? "border-[#b495d6] bg-[#e8dcf5] dark:border-[#5c5068] dark:bg-[#2f2938]"
                          : "border-border/80 bg-background hover:border-[#b495d6] hover:bg-[#e8dcf5]/45 dark:bg-[#202124]",
                      card.flipped && "ring-2 ring-[#b495d6]",
                    )}
                  >
                    {card.flipped || card.matched ? (
                      <div className="flex items-center justify-center h-full text-2xl font-bold">
                        {card.value}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">
                        ?
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!gameStarted && (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/20 py-12 text-center text-muted-foreground">
              Choose Setup to configure the first match.
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "vs_computer" && currentPlayer === 2
                ? "Computer is thinking..."
                : "Processing..."}
            </div>
          )}

          {gameOver && (
            <div className="rounded-lg border bg-green-100 dark:bg-green-900/20 p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="font-semibold text-lg">
                {winner
                  ? `${winner === 1 ? player1Name : player2Name} wins!`
                  : "It's a tie!"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Completed in {moves} moves
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <GameSetupSheet
        open={showSetupSheet}
        onOpenChange={setShowSetupSheet}
        title="Set up Memory Match"
        description="Choose a play path and board size without mixing local and online settings."
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
                  ? () => void createOnlineRoom()
                  : () => startSession(mode)
              }
              disabled={isLoading || creatingOnlineRoom}
              className="flex-[1.35]"
            >
              {isLoading || creatingOnlineRoom ? (
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
                  description: "Play a solo match.",
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

          <section className="space-y-3">
            <Label className="text-sm font-semibold">Board size</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(setupPath === "online"
                ? (["easy", "medium", "hard"] as const)
                : GRID_SIZES
              ).map((size, index) => {
                const label = typeof size === "string" ? size : size.label;
                const selected =
                  setupPath === "online"
                    ? onlineDifficulty === size
                    : gridSize === index;

                return (
                  <Button
                    key={label}
                    type="button"
                    variant={selected ? "secondary" : "outline"}
                    onClick={() => {
                      if (setupPath === "online" && typeof size === "string") {
                        setOnlineDifficulty(size);
                      } else {
                        setGridSize(index);
                      }
                    }}
                    className="capitalize"
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </section>

          {setupPath === "online" ? (
            <section className="space-y-5 rounded-2xl border border-border/70 bg-muted/25 p-4">
              <div className="space-y-2">
                <Label htmlFor="memory-online-name">Your display name</Label>
                <Input
                  id="memory-online-name"
                  value={player1Name}
                  onChange={(event) => setPlayer1Name(event.target.value)}
                />
              </div>
              <div className="space-y-2 border-t border-border/70 pt-4">
                <Label htmlFor="memory-room-code">Already have a room?</Label>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    id="memory-room-code"
                    value={onlineRoomCode}
                    onChange={(event) =>
                      setOnlineRoomCode(event.target.value.toUpperCase())
                    }
                    placeholder="Room code"
                    className="uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={joinOnlineRoom}
                    disabled={joiningOnlineRoom}
                  >
                    {joiningOnlineRoom ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Join room"
                    )}
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
                    ? "You are Player 1. The computer takes Player 2."
                    : "Choose the names used for score and turn labels."}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memory-player-one">Player 1</Label>
                  <Input
                    id="memory-player-one"
                    value={player1Name}
                    onChange={(event) => setPlayer1Name(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memory-player-two">Player 2</Label>
                  <Input
                    id="memory-player-two"
                    value={player2Name}
                    onChange={(event) => setPlayer2Name(event.target.value)}
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
