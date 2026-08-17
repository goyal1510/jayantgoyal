"use client";

import * as React from "react";
import Image from "next/image";
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
  parseRpsState,
  RPS_CHOICES,
  type RpsChoice,
  type RpsSeat,
  type RpsState,
} from "@/lib/games/rock-paper-scissors";

type Participant = {
  id: string;
  display_name: string;
  seat: RpsSeat;
  user_id: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed" | "abandoned";
  winner_participant_id: string | null;
  state: RpsState | JsonObject;
};

const CHOICE_META: Record<RpsChoice, { label: string; image: string }> = {
  rock: {
    label: "Rock",
    image: "/assets/games/Rock-Paper-Scissor/resources/rock.png",
  },
  paper: {
    label: "Paper",
    image: "/assets/games/Rock-Paper-Scissor/resources/paper.png",
  },
  scissors: {
    label: "Scissors",
    image: "/assets/games/Rock-Paper-Scissor/resources/scissors.png",
  },
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

export function OnlineRockPaperScissorsRoom({
  roomCode,
}: {
  roomCode: string;
}) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [displayName, setDisplayName] = React.useState("Player");
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [submittingChoice, setSubmittingChoice] =
    React.useState<RpsChoice | null>(null);
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
      toast.error("Unable to load Rock Paper Scissors room");
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
      .channel(`rps-${session.id}`)
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

  const state = parseRpsState(session?.state);
  const playerOne = participants.find(
    (participant) => participant.seat === "P1",
  );
  const playerTwo = participants.find(
    (participant) => participant.seat === "P2",
  );
  const me = participants.find((participant) => participant.user_id === userId);
  const mySeat = me?.seat;
  const myPendingChoice = mySeat ? state.pendingChoices[mySeat] : null;
  const roomActive = session?.status === "active";
  const canChoose =
    roomActive && !!mySeat && !myPendingChoice && !submittingChoice;

  const status =
    session?.status === "waiting"
      ? "Waiting for player 2"
      : session?.status === "completed"
        ? `${session.winner_participant_id === playerOne?.id ? playerOne?.display_name : playerTwo?.display_name} wins`
        : myPendingChoice
          ? "Choice locked. Waiting for opponent."
          : "Choose your move";

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
      toast.error(data.error ?? "Unable to join Rock Paper Scissors room");
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
      `${window.location.origin}/games/rock-paper-scissors/room/${roomCode}`,
    );
    toast.success("Invite link copied");
  };

  const submitChoice = async (choice: RpsChoice) => {
    if (!canChoose) return;

    setSubmittingChoice(choice);
    const response = await fetch(
      `/api/games/rock-paper-scissors/${roomCode}/moves`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movePayload: { choice } }),
      },
    );
    setSubmittingChoice(null);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to record choice");
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
      <Card className="overflow-hidden border-fuchsia-200 bg-[radial-gradient(circle_at_top_left,#fae8ff,transparent_32%),linear-gradient(135deg,#faf5ff,#fdf2f8)] dark:border-fuchsia-950 dark:bg-[linear-gradient(135deg,#2e1065,#4a044e)]">
        <OnlineRoomHeader
          game="rock-paper-scissors"
          roomCode={roomCode}
          status={status}
          onCopyInvite={copyInvite}
        />
        <CardContent className="space-y-4 pb-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {RPS_CHOICES.map((choice) => (
              <Button
                key={choice}
                variant="secondary"
                className={cn(
                  "flex min-h-[150px] flex-col items-center gap-3 py-6",
                  myPendingChoice === choice && "ring-2 ring-fuchsia-500",
                )}
                disabled={!canChoose}
                onClick={() => void submitChoice(choice)}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-background">
                  <Image
                    src={CHOICE_META[choice].image}
                    alt={CHOICE_META[choice].label}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain"
                    priority={choice === "rock"}
                  />
                </div>
                <span className="text-sm font-medium">
                  {CHOICE_META[choice].label}
                </span>
                {submittingChoice === choice && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            ))}
          </div>

          <div className="rounded-lg border bg-background/80 p-3 text-sm">
            <div className="font-medium">Round {state.round}</div>
            <div className="text-muted-foreground">{status}</div>
          </div>

          {state.lastRound && (
            <div className="rounded-lg border bg-background/80 p-3 text-sm">
              <div className="font-medium">Last reveal</div>
              <div className="mt-1 text-muted-foreground">
                P1 chose {CHOICE_META[state.lastRound.choices.P1].label}, P2
                chose {CHOICE_META[state.lastRound.choices.P2].label}.
              </div>
              <div className="mt-1 font-semibold">
                {state.lastRound.outcome === "draw"
                  ? "Draw"
                  : `${state.lastRound.outcome} won the round`}
              </div>
            </div>
          )}
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
                <Label htmlFor="rps-room-name">Your display name</Label>
                <Input
                  id="rps-room-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <Button onClick={joinRoom} disabled={joining} className="w-full">
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join room"
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
                  P1
                </div>
                <div className="truncate font-medium">
                  {playerOne?.display_name ?? "Open"}
                </div>
                <div className="mt-1 text-xl font-semibold">
                  {state.scores.P1}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  P2
                </div>
                <div className="truncate font-medium">
                  {playerTwo?.display_name ?? "Open"}
                </div>
                <div className="mt-1 text-xl font-semibold">
                  {state.scores.P2}
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Draws
              </div>
              <div className="text-xl font-semibold">{state.scores.draws}</div>
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
