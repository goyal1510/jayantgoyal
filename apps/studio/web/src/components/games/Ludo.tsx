"use client";

import { useState } from "react";
import { Loader2, Users } from "lucide-react";
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
import { cn } from "@jayantgoyal/web-ui/lib/utils";

import { createLudoState } from "@/lib/games/ludo";

export function Ludo() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [onlineName, setOnlineName] = useState("Ludo Player");
  const [playerCount, setPlayerCount] = useState(2);
  const [targetTokens, setTargetTokens] = useState(4);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const createRoom = async () => {
    setCreating(true);
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "ludo",
        displayName: onlineName,
        settings: {
          maxPlayers: playerCount,
          targetTokens,
          initialState: createLudoState(playerCount, targetTokens),
        },
      }),
    });
    setCreating(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to create Ludo room");
      return;
    }

    const data = await response.json();
    const nextRoomCode = data.session?.session?.room_code;
    if (typeof nextRoomCode === "string") {
      router.push(`/games/ludo/room/${nextRoomCode}`);
    }
  };

  const joinRoom = () => {
    const normalized = roomCode.trim().toUpperCase();
    if (!normalized) {
      toast.error("Enter a room code");
      return;
    }

    setJoining(true);
    router.push(`/games/ludo/room/${normalized}`);
  };

  return (
    <Card className="mx-auto w-full max-w-5xl overflow-hidden rounded-[1.75rem] border-border/80 bg-card shadow-none">
      <CardHeader className="border-b border-border/70 p-5 sm:p-6">
        <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
          Online only
        </p>
        <CardTitle className="text-2xl tracking-[-0.035em]">
          Create a race or join your friends.
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5 rounded-[1.5rem] border border-[#d93328] bg-[#ff5a4f] p-5 text-[#211512] sm:p-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em]">
              New room
            </h2>
            <p className="mt-2 text-sm leading-6 opacity-80">
              Choose the race size before sharing the room code.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ludo-online-name">Your display name</Label>
            <Input
              id="ludo-online-name"
              value={onlineName}
              onChange={(event) => setOnlineName(event.target.value)}
              className="border-black/20 bg-white/55 text-[#211512] placeholder:text-[#211512]/55"
            />
          </div>
          <div className="space-y-2">
            <Label>Players</Label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <Button
                  key={count}
                  type="button"
                  variant={playerCount === count ? "secondary" : "outline"}
                  onClick={() => setPlayerCount(count)}
                  className={cn(
                    "border-black/20 text-[#211512] hover:bg-white/65",
                    playerCount === count ? "bg-white/80" : "bg-white/35",
                  )}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Finish target</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={targetTokens === 1 ? "secondary" : "outline"}
                onClick={() => setTargetTokens(1)}
                className={cn(
                  "border-black/20 text-[#211512] hover:bg-white/65",
                  targetTokens === 1 ? "bg-white/80" : "bg-white/35",
                )}
              >
                Quick · 1 token
              </Button>
              <Button
                type="button"
                variant={targetTokens === 4 ? "secondary" : "outline"}
                onClick={() => setTargetTokens(4)}
                className={cn(
                  "border-black/20 text-[#211512] hover:bg-white/65",
                  targetTokens === 4 ? "bg-white/80" : "bg-white/35",
                )}
              >
                Classic · 4 tokens
              </Button>
            </div>
          </div>
          <Button
            onClick={() => void createRoom()}
            disabled={creating}
            className="w-full bg-[#211512] text-[#fff8ef] hover:bg-[#211512]/90"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Ludo room"
            )}
          </Button>
        </section>

        <section className="flex flex-col justify-between gap-6 rounded-[1.5rem] border border-border/70 bg-muted/25 p-5 sm:p-6">
          <div>
            <span className="grid size-11 place-items-center rounded-xl border border-border/70 bg-background">
              <Users className="size-5" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">
              Join a room
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter the code shared by the room creator.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ludo-room-code">Room code</Label>
            <Input
              id="ludo-room-code"
              value={roomCode}
              onChange={(event) =>
                setRoomCode(event.target.value.toUpperCase())
              }
              placeholder="Room code"
              className="uppercase"
            />
            <Button
              variant="outline"
              onClick={joinRoom}
              disabled={joining}
              className="w-full"
            >
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Join room"
              )}
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
