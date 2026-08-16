"use client";

import { useState } from "react";
import { BarChart3, Delete, Globe2, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
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

import { GameSetupSheet } from "@/components/games/game-setup-sheet";
import {
  useWordle,
  KEYBOARD_ROWS,
  STATE_COLORS,
  KEY_COLORS,
} from "@/components/games/use-wordle";
import { createWordleState } from "@/lib/games/wordle";

export function Wordle() {
  const router = useRouter();
  const {
    mode,
    guesses,
    gameOver,
    won,
    shakeRow,
    revealingRow,
    stats,
    showStats,
    setShowStats,
    gridRows,
    kbState,
    startGame,
    handleKey,
  } = useWordle();
  const [onlineRoomCode, setOnlineRoomCode] = useState("");
  const [onlineName, setOnlineName] = useState("Wordle Player");
  const [creatingOnlineRoom, setCreatingOnlineRoom] = useState(false);
  const [joiningOnlineRoom, setJoiningOnlineRoom] = useState(false);
  const [showOnlineSetup, setShowOnlineSetup] = useState(false);

  const createOnlineRoom = async () => {
    setCreatingOnlineRoom(true);
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "wordle",
        displayName: onlineName,
        settings: {
          initialState: createWordleState(),
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
      router.push(`/games/wordle/room/${roomCode}`);
    }
  };

  const joinOnlineRoom = () => {
    const normalized = onlineRoomCode.trim().toUpperCase();
    if (!normalized) {
      toast.error("Enter a room code");
      return;
    }

    setJoiningOnlineRoom(true);
    router.push(`/games/wordle/room/${normalized}`);
  };

  if (!mode) {
    return (
      <>
        <div className="space-y-4">
          <Card className="mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] border-border/80 bg-card shadow-none">
            <CardHeader className="border-b border-border/70 p-5 sm:p-6">
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
                Choose a challenge
              </p>
              <CardTitle className="text-2xl tracking-[-0.035em]">
                Guess one five-letter word in six tries.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => startGame("daily")}
                  className="rounded-2xl border border-[#bdc4a3] bg-[#d9ddc3] p-5 text-left text-[#211512] transition hover:-translate-y-0.5 dark:border-[#4b594b] dark:bg-[#29312a] dark:text-[#fff8ef]"
                >
                  <span className="text-xl font-semibold tracking-[-0.03em]">
                    Daily challenge
                  </span>
                  <span className="mt-2 block text-sm leading-6 opacity-80">
                    One shared word for today.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => startGame("random")}
                  className="rounded-2xl border border-[#cfc0e4] bg-[#e8dcf5] p-5 text-left text-[#211512] transition hover:-translate-y-0.5 dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]"
                >
                  <span className="text-xl font-semibold tracking-[-0.03em]">
                    Random word
                  </span>
                  <span className="mt-2 block text-sm leading-6 opacity-80">
                    Start a fresh solo puzzle.
                  </span>
                </button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowOnlineSetup(true)}
                className="w-full"
              >
                <Globe2 className="mr-2 size-4" />
                Play an online challenge
              </Button>
            </CardContent>
          </Card>
          {stats.gamesPlayed > 0 && (
            <Card className="mx-auto w-full max-w-3xl rounded-[1.5rem] border-border/80 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.gamesPlayed}
                    </div>
                    <div className="text-xs text-muted-foreground">Played</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.gamesPlayed
                        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                        : 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Win %</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.maxStreak}</div>
                    <div className="text-xs text-muted-foreground">Max</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <GameSetupSheet
          open={showOnlineSetup}
          onOpenChange={setShowOnlineSetup}
          title="Play Wordle online"
          description="Create a shared challenge or join an existing room."
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
                onClick={() => void createOnlineRoom()}
                disabled={creatingOnlineRoom}
                className="flex-[1.35]"
              >
                {creatingOnlineRoom ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Create challenge"
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="wordle-online-name">Your display name</Label>
              <Input
                id="wordle-online-name"
                value={onlineName}
                onChange={(event) => setOnlineName(event.target.value)}
              />
            </div>
            <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/25 p-4">
              <Label htmlFor="wordle-room-code">Already have a room?</Label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  id="wordle-room-code"
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
          </div>
        </GameSetupSheet>
      </>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-3xl overflow-hidden rounded-[1.75rem] border-border/80 bg-card shadow-none">
      <div className="flex w-full items-center justify-between border-b border-border/70 p-5 sm:p-6">
        <div>
          <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
            {mode === "daily" ? "Daily challenge" : "Random challenge"}
          </p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
            {gameOver
              ? won
                ? "Solved"
                : "Round complete"
              : `${6 - guesses.length} ${6 - guesses.length === 1 ? "guess" : "guesses"} remaining`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowStats(true)}
            title="Stats"
          >
            <span className="sr-only">View statistics</span>
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => startGame(mode)}
            title="New game"
          >
            <span className="sr-only">Start a new game</span>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="flex flex-col items-center gap-5 p-5 sm:p-6">
        <div className="grid gap-1.5">
          {gridRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={`flex gap-1.5 ${shakeRow === rowIdx ? "animate-shake" : ""}`}
            >
              {row.map((cell, colIdx) => {
                const isRevealing = revealingRow === rowIdx;
                const delay = isRevealing ? colIdx * 150 : 0;
                const hasLetter = cell.letter !== "";
                const isCurrentRow = rowIdx === guesses.length && !gameOver;

                return (
                  <div
                    key={colIdx}
                    className={`flex h-14 w-14 items-center justify-center border-2 text-2xl font-bold uppercase transition-all duration-300 sm:h-16 sm:w-16 ${STATE_COLORS[cell.state]} ${hasLetter && isCurrentRow ? "scale-105" : ""}`}
                    style={{
                      transitionDelay: `${delay}ms`,
                      animationDelay: `${delay}ms`,
                    }}
                  >
                    {cell.letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-2 flex w-full flex-col items-center gap-1.5">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 sm:gap-1.5">
              {row.map((key) => {
                const isSpecial = key === "Enter" || key === "\u232B";
                const state = isSpecial ? "empty" : (kbState[key] ?? "empty");
                return (
                  <button
                    key={key}
                    onClick={() =>
                      handleKey(key === "\u232B" ? "Backspace" : key)
                    }
                    aria-label={key === "\u232B" ? "Backspace" : key}
                    className={`flex h-12 items-center justify-center rounded-md border text-sm font-semibold uppercase transition-colors sm:h-14 ${
                      isSpecial
                        ? "bg-zinc-200 px-2.5 text-foreground hover:bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-500 sm:px-4"
                        : `w-8 sm:w-10 ${KEY_COLORS[state]}`
                    }`}
                  >
                    {key === "\u232B" ? <Delete className="size-4" /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {showStats && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStats(false)}
          >
            <Card
              className="mx-4 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-center text-lg">
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.gamesPlayed}
                    </div>
                    <div className="text-xs text-muted-foreground">Played</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.gamesPlayed
                        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                        : 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Win %</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.maxStreak}</div>
                    <div className="text-xs text-muted-foreground">Max</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold">Guess Distribution</h3>
                  {stats.guessDistribution.map((count, i) => {
                    const max = Math.max(...stats.guessDistribution, 1);
                    const pct = Math.max((count / max) * 100, 8);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-4 text-sm font-medium">{i + 1}</span>
                        <div
                          className={`rounded px-2 py-0.5 text-right text-xs font-semibold text-white ${
                            won && guesses.length === i + 1
                              ? "bg-emerald-500"
                              : "bg-zinc-400 dark:bg-zinc-600"
                          }`}
                          style={{ width: `${pct}%`, minWidth: "24px" }}
                        >
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  {gameOver && (
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setShowStats(false);
                        startGame(mode);
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {mode === "daily" ? "Play Random" : "New Game"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowStats(false)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* eslint-disable-next-line react/no-unknown-property */}
        <style jsx>{`
          @keyframes shake {
            0%,
            100% {
              transform: translateX(0);
            }
            10%,
            30%,
            50%,
            70%,
            90% {
              transform: translateX(-4px);
            }
            20%,
            40%,
            60%,
            80% {
              transform: translateX(4px);
            }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
