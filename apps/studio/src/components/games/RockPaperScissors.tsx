"use client";

import Image from "next/image";
import { useState } from "react";
import { Globe2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

import { GameSetupSheet } from "@/components/games/game-setup-sheet";
import { EMPTY_RPS_STATE } from "@/lib/games/rock-paper-scissors";

type Choice = "rock" | "paper" | "scissors";

const CHOICES: { key: Choice; label: string; image: string }[] = [
  {
    key: "rock",
    label: "Rock",
    image: "/assets/games/Rock-Paper-Scissor/resources/rock.png",
  },
  {
    key: "paper",
    label: "Paper",
    image: "/assets/games/Rock-Paper-Scissor/resources/paper.png",
  },
  {
    key: "scissors",
    label: "Scissors",
    image: "/assets/games/Rock-Paper-Scissor/resources/scissors.png",
  },
];

export function RockPaperScissors() {
  const router = useRouter();
  const [totals, setTotals] = useState({
    humanWins: 0,
    computerWins: 0,
    draws: 0,
  });
  const [lastRound, setLastRound] = useState<{
    roundNumber: number;
    userChoice: Choice;
    computerChoice: Choice;
    outcome: "win" | "loss" | "draw";
  } | null>(null);
  const [message, setMessage] = useState<string>(
    "Pick a move to start playing.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onlineName, setOnlineName] = useState("Player 1");
  const [joinCode, setJoinCode] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showOnlineSetup, setShowOnlineSetup] = useState(false);

  const getChoiceMeta = (key: Choice) =>
    CHOICES.find((choice) => choice.key === key) ?? CHOICES[0]!;

  const playRound = async (choice: Choice) => {
    setIsSubmitting(true);
    const computerChoice =
      CHOICES[Math.floor(Math.random() * CHOICES.length)]!.key;
    const humanWins =
      (choice === "rock" && computerChoice === "scissors") ||
      (choice === "paper" && computerChoice === "rock") ||
      (choice === "scissors" && computerChoice === "paper");
    const isDraw = choice === computerChoice;
    const outcome: "win" | "loss" | "draw" = isDraw
      ? "draw"
      : humanWins
        ? "win"
        : "loss";

    setTotals((prev) => {
      const next = { ...prev };
      if (outcome === "win") next.humanWins += 1;
      if (outcome === "loss") next.computerWins += 1;
      if (outcome === "draw") next.draws += 1;
      return next;
    });

    setLastRound((prev) => ({
      roundNumber: (prev?.roundNumber ?? 0) + 1,
      userChoice: choice,
      computerChoice,
      outcome,
    }));

    const nextMessage =
      outcome === "draw"
        ? "Draw."
        : outcome === "win"
          ? "You win this round!"
          : "Computer wins this round.";
    setMessage(nextMessage);
    if (outcome === "win") toast.success("You win this round!");
    else if (outcome === "loss") toast.error("Computer wins this round.");
    else toast("Draw", { description: "Both picked the same move." });
    setIsSubmitting(false);
  };

  const resetLocal = () => {
    setTotals({ humanWins: 0, computerWins: 0, draws: 0 });
    setLastRound(null);
    setMessage("Pick a move to start playing.");
  };

  const createOnlineRoom = async () => {
    setCreatingRoom(true);
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "rock-paper-scissors",
        displayName: onlineName,
        settings: { initialState: EMPTY_RPS_STATE },
      }),
    });
    setCreatingRoom(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to create Rock Paper Scissors room");
      return;
    }

    const data = await response.json();
    const roomCode = data?.session?.session?.room_code;
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned");
      return;
    }

    router.push(`/games/rock-paper-scissors/room/${roomCode}`);
  };

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code");
      return;
    }
    router.push(`/games/rock-paper-scissors/room/${roomCode}`);
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[1.75rem] border-border/80 bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 p-5 sm:p-6">
          <div>
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
              Solo match
            </p>
            <CardTitle className="mt-1 text-2xl tracking-[-0.035em]">
              {isSubmitting ? "Playing round" : message}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={resetLocal}
              disabled={isSubmitting}
            >
              Reset score
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CHOICES.map((choice) => (
              <Button
                key={choice.key}
                variant="secondary"
                className="flex min-h-[160px] flex-col items-center gap-3 rounded-2xl border border-[#cfc0e4] bg-[#e8dcf5] py-6 text-[#211512] shadow-none hover:bg-[#ddcaef] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef] dark:hover:bg-[#393144]"
                disabled={isSubmitting}
                onClick={() => playRound(choice.key)}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-current/15 bg-white/45 dark:bg-black/10">
                  <Image
                    src={choice.image}
                    alt={choice.label}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain"
                    priority={choice.key === "rock"}
                  />
                </div>
                <span className="text-sm font-medium">{choice.label}</span>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <StatBadge label="You" value={totals.humanWins} highlight />
            <StatBadge label="Computer" value={totals.computerWins} />
            <StatBadge label="Draws" value={totals.draws} />
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-muted/25 p-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">Last round</div>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {lastRound ? (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-border/70 bg-background p-4">
                  <div className="text-xs text-muted-foreground">You</div>
                  <div className="flex items-center gap-2">
                    <div className="h-14 w-14 rounded-md border bg-muted/40">
                      <Image
                        src={getChoiceMeta(lastRound.userChoice).image}
                        alt={getChoiceMeta(lastRound.userChoice).label}
                        width={56}
                        height={56}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <div className="font-semibold">
                      {getChoiceMeta(lastRound.userChoice).label}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-border/70 bg-background p-4">
                  <div className="text-xs text-muted-foreground">Computer</div>
                  <div className="flex items-center gap-2">
                    <div className="h-14 w-14 rounded-md border bg-muted/40">
                      <Image
                        src={getChoiceMeta(lastRound.computerChoice).image}
                        alt={getChoiceMeta(lastRound.computerChoice).label}
                        width={56}
                        height={56}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                    <div className="font-semibold">
                      {getChoiceMeta(lastRound.computerChoice).label}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  Round {lastRound.roundNumber} result:{" "}
                  <span className="font-semibold text-foreground">
                    {lastRound.outcome === "draw"
                      ? "Draw"
                      : lastRound.outcome === "win"
                        ? "You win"
                        : "Computer wins"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-muted-foreground">No rounds yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <GameSetupSheet
        open={showOnlineSetup}
        onOpenChange={setShowOnlineSetup}
        title="Play Rock Paper Scissors online"
        description="Create a new challenge or join a room someone shared with you."
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
              disabled={creatingRoom}
              className="flex-[1.35]"
            >
              {creatingRoom ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create room"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="rps-online-name">Your display name</Label>
            <Input
              id="rps-online-name"
              value={onlineName}
              onChange={(event) => setOnlineName(event.target.value)}
            />
          </div>
          <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/25 p-4">
            <Label htmlFor="rps-room-code">Already have a room?</Label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                id="rps-room-code"
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
        </div>
      </GameSetupSheet>
    </>
  );
}

function StatBadge({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border border-border/70 bg-background p-3 text-center"
      data-highlight={highlight}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
