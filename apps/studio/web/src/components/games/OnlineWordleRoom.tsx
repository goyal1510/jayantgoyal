"use client";

import * as React from "react";
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
import { STATE_COLORS } from "@/components/games/use-wordle";
import type {
  JsonObject,
  OnlineSessionBundle,
} from "@/lib/games/online-sessions";
import {
  parseWordleState,
  WORDLE_MAX_GUESSES,
  WORDLE_WORD_LENGTH,
  type WordleState,
} from "@/lib/games/wordle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Participant = {
  id: string;
  display_name: string;
  seat: "P1" | "P2";
  user_id: string;
};

type Session = {
  id: string;
  room_code: string;
  status: "waiting" | "active" | "completed" | "abandoned";
  state: WordleState | JsonObject;
};

function coerceBundle(bundle: OnlineSessionBundle | null): {
  session: Session | null;
  participants: Participant[];
  result: JsonObject | null;
} {
  if (!bundle?.session)
    return { session: null, participants: [], result: null };
  return {
    session: bundle.session as Session,
    participants: bundle.participants as Participant[],
    result: bundle.result,
  };
}

function buildRows(guesses: WordleState["players"]["P1"]["guesses"]) {
  return Array.from({ length: WORDLE_MAX_GUESSES }, (_, rowIndex) => {
    const guess = guesses[rowIndex];
    if (guess) {
      return guess.word.split("").map((letter, index) => ({
        letter,
        state: guess.states[index] ?? "absent",
      }));
    }

    return Array.from({ length: WORDLE_WORD_LENGTH }, () => ({
      letter: "",
      state: "empty" as const,
    }));
  });
}

export function OnlineWordleRoom({ roomCode }: { roomCode: string }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [result, setResult] = React.useState<JsonObject | null>(null);
  const [displayName, setDisplayName] = React.useState("Player");
  const [guess, setGuess] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [joining, setJoining] = React.useState(false);
  const [submittingGuess, setSubmittingGuess] = React.useState(false);
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
      toast.error("Unable to load Wordle room");
      return;
    }

    const data = (await response.json()) as {
      session: OnlineSessionBundle | null;
    };
    const bundle = coerceBundle(data.session);
    setSession(bundle.session);
    setParticipants(bundle.participants);
    setResult(bundle.result);
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
      .channel(`wordle-${session.id}`)
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

  const state = parseWordleState(session?.state);
  const playerOne = participants.find(
    (participant) => participant.seat === "P1",
  );
  const playerTwo = participants.find(
    (participant) => participant.seat === "P2",
  );
  const me = participants.find((participant) => participant.user_id === userId);
  const mySeat = me?.seat;
  const myState = mySeat ? state.players[mySeat] : null;
  const canGuess =
    session?.status === "active" &&
    Boolean(mySeat) &&
    !myState?.done &&
    !state.winner &&
    !state.isDraw;
  const solution = getResultSolution(result);
  const status =
    session?.status === "waiting"
      ? "Waiting for P2"
      : state.winner
        ? `${state.winner} solved it`
        : state.isDraw
          ? "No winner"
          : "Both players can guess";

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
      toast.error(data.error ?? "Unable to join Wordle room");
      return;
    }

    const data = (await response.json()) as {
      session: OnlineSessionBundle | null;
    };
    const bundle = coerceBundle(data.session);
    setSession(bundle.session);
    setParticipants(bundle.participants);
    setResult(bundle.result);
    setNeedsJoin(false);
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/games/wordle/room/${roomCode}`,
    );
    toast.success("Invite link copied");
  };

  const submitGuess = async () => {
    if (!canGuess || submittingGuess) return;
    const normalized = guess.trim().toLowerCase();
    if (!/^[a-z]{5}$/.test(normalized)) {
      toast.error("Enter a 5-letter word");
      return;
    }

    setSubmittingGuess(true);
    const response = await fetch(`/api/games/wordle/${roomCode}/guesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movePayload: { guess: normalized } }),
    });
    setSubmittingGuess(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to submit guess");
      return;
    }

    setGuess("");
    const data = (await response.json()) as {
      session: OnlineSessionBundle | null;
    };
    const bundle = coerceBundle(data.session);
    setSession(bundle.session);
    setParticipants(bundle.participants);
    setResult(bundle.result);
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
      <Card className="overflow-hidden border-emerald-200 bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_34%),linear-gradient(135deg,#f8fafc,#ecfdf5)] dark:border-emerald-900/70 dark:bg-[linear-gradient(135deg,#111827,#064e3b)]">
        <OnlineRoomHeader
          game="wordle"
          roomCode={roomCode}
          status={status}
          onCopyInvite={copyInvite}
        />
        <CardContent className="space-y-4 pb-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {(["P1", "P2"] as const).map((seat) => {
              const participant = seat === "P1" ? playerOne : playerTwo;
              const player = state.players[seat];
              return (
                <div
                  key={seat}
                  className={cn(
                    "rounded-lg border bg-background/80 p-3",
                    mySeat === seat && "ring-2 ring-emerald-400",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {seat}
                      </div>
                      <div className="font-semibold">
                        {participant?.display_name ?? "Open"}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {player.won
                        ? "Solved"
                        : player.done
                          ? "Done"
                          : `${player.guesses.length}/${state.maxGuesses}`}
                    </div>
                  </div>
                  <div className="grid gap-1">
                    {buildRows(player.guesses).map((row, rowIndex) => (
                      <div key={rowIndex} className="flex justify-center gap-1">
                        {row.map((cell, cellIndex) => (
                          <div
                            key={cellIndex}
                            className={cn(
                              "flex h-10 w-10 items-center justify-center border-2 text-lg font-bold uppercase sm:h-11 sm:w-11",
                              STATE_COLORS[cell.state],
                            )}
                          >
                            {cell.letter}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-auto flex max-w-md gap-2">
            <Input
              value={guess}
              onChange={(event) =>
                setGuess(
                  event.target.value.slice(0, WORDLE_WORD_LENGTH).toLowerCase(),
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") void submitGuess();
              }}
              disabled={!canGuess || submittingGuess}
              placeholder={canGuess ? "Enter guess" : "Waiting"}
              className="uppercase"
            />
            <Button
              onClick={() => void submitGuess()}
              disabled={!canGuess || submittingGuess}
            >
              {submittingGuess ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Guess"
              )}
            </Button>
          </div>
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
                <Label htmlFor="wordle-room-name">Your display name</Label>
                <Input
                  id="wordle-room-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <Button onClick={joinRoom} disabled={joining} className="w-full">
                {joining ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Join as P2"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <div className="text-lg font-semibold">{status}</div>
            </div>
            {solution && (
              <div className="rounded-lg border p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Answer
                </div>
                <div className="font-mono text-lg font-semibold uppercase tracking-[0.2em]">
                  {solution}
                </div>
              </div>
            )}
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Mode
              </div>
              <div className="font-medium">First solver wins</div>
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

function getResultSolution(result: JsonObject | null): string | null {
  if (
    !result?.summary ||
    typeof result.summary !== "object" ||
    Array.isArray(result.summary)
  ) {
    return null;
  }
  const summary = result.summary as JsonObject;
  return typeof summary.solution === "string" ? summary.solution : null;
}
