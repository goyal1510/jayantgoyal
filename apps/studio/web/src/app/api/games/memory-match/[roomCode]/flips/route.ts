import { NextResponse, type NextRequest } from "next/server";

import {
  asJsonObject,
  isSafeJsonPayload,
  normalizeRoomCode,
} from "@/lib/games/online-sessions";
import {
  getCurrentMoveNumber,
  getOnlineSessionBundle,
  recordOnlineGameAction,
} from "@/lib/games/online-sessions.server";
import {
  getMemoryMatchWinner,
  memoryMatchStateToJson,
  nextMemoryMatchSeat,
  parseMemoryMatchState,
  type MemoryMatchSeat,
} from "@/lib/games/memory-match";
import { createSupabaseServiceRoleClient } from "@jayantgoyal/web-auth/service-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  const auth = await createSupabaseServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomCode: rawRoomCode } = await params;
  const roomCode = normalizeRoomCode(rawRoomCode);
  if (!roomCode) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const movePayload = asJsonObject(body?.movePayload);
  const rawCardId = movePayload.cardId;

  if (
    typeof rawCardId !== "number" ||
    !Number.isInteger(rawCardId) ||
    rawCardId < 0 ||
    !isSafeJsonPayload(movePayload)
  ) {
    return NextResponse.json(
      { error: "A valid cardId is required." },
      { status: 400 },
    );
  }

  const cardId = rawCardId;
  const supabase = createSupabaseServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .schema("studio")
    .from("game_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .eq("game_slug", "memory-match")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Memory Match room not found." },
      { status: 404 },
    );
  }

  if (session.status !== "active") {
    return NextResponse.json(
      { error: "Memory Match room is not active." },
      { status: 409 },
    );
  }

  const { data: participant } = await supabase
    .schema("studio")
    .from("game_session_participants")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", user.id)
    .is("left_at", null)
    .single();

  if (!participant) {
    return NextResponse.json(
      { error: "You have not joined this room." },
      { status: 403 },
    );
  }

  const seat =
    participant.seat === "P1" || participant.seat === "P2"
      ? (participant.seat as MemoryMatchSeat)
      : null;
  const currentState = parseMemoryMatchState(session.state);

  if (!seat || seat !== currentState.currentSeat) {
    return NextResponse.json(
      { error: "It is not your turn." },
      { status: 409 },
    );
  }

  if (
    session.current_turn_participant_id &&
    session.current_turn_participant_id !== participant.id
  ) {
    return NextResponse.json(
      { error: "It is not your turn." },
      { status: 409 },
    );
  }

  if (
    currentState.winner ||
    currentState.isDraw ||
    currentState.selectedCards.length >= 2
  ) {
    return NextResponse.json(
      { error: "The board is not ready for another flip." },
      { status: 409 },
    );
  }

  const targetCard = currentState.cards.find((card) => card.id === cardId);
  if (
    !targetCard ||
    targetCard.flipped ||
    targetCard.matched ||
    currentState.selectedCards.includes(cardId)
  ) {
    return NextResponse.json(
      { error: "That card is not playable." },
      { status: 400 },
    );
  }

  const selectedCards = [...currentState.selectedCards, cardId];
  let cards = currentState.cards.map((card) =>
    card.id === cardId ? { ...card, flipped: true } : card,
  );
  let scores = { ...currentState.scores };
  let currentSeat = currentState.currentSeat;
  let moves = currentState.moves;
  let winner: MemoryMatchSeat | null = null;
  let isDraw = false;
  let lastMove = {
    seat,
    cardIds: selectedCards,
    matched: null as boolean | null,
  };

  if (selectedCards.length === 2) {
    const [firstId, secondId] = selectedCards;
    const firstCard = cards.find((card) => card.id === firstId);
    const secondCard = cards.find((card) => card.id === secondId);

    if (!firstCard || !secondCard || firstCard.id === secondCard.id) {
      return NextResponse.json(
        { error: "Invalid card selection." },
        { status: 400 },
      );
    }

    moves += 1;
    const matched = firstCard.value === secondCard.value;
    lastMove = { seat, cardIds: selectedCards, matched };

    if (matched) {
      cards = cards.map((card) =>
        card.id === firstId || card.id === secondId
          ? { ...card, flipped: true, matched: true }
          : card,
      );
      scores = { ...scores, [seat]: scores[seat] + 1 };
    } else {
      cards = cards.map((card) =>
        card.id === firstId || card.id === secondId
          ? { ...card, flipped: false, matched: false }
          : card,
      );
      currentSeat = nextMemoryMatchSeat(seat);
    }

    const allMatched = cards.length > 0 && cards.every((card) => card.matched);
    if (allMatched) {
      winner = getMemoryMatchWinner(scores);
      isDraw = !winner;
      currentSeat = seat;
    }
  }

  const resultingState = memoryMatchStateToJson({
    cards,
    currentSeat,
    selectedCards: selectedCards.length === 2 ? [] : selectedCards,
    scores,
    moves,
    winner,
    isDraw,
    lastMove,
    difficulty: currentState.difficulty,
  });
  const moveNumber = (await getCurrentMoveNumber(supabase, session.id)) + 1;
  const completion = winner
    ? { outcome: "win", winner }
    : isDraw
      ? { outcome: "draw" }
      : null;

  let nextParticipantId: string | null = null;
  if (!completion) {
    const { data: nextParticipant } = await supabase
      .schema("studio")
      .from("game_session_participants")
      .select("id")
      .eq("session_id", session.id)
      .eq("seat", currentSeat)
      .is("left_at", null)
      .maybeSingle();

    nextParticipantId = nextParticipant?.id ?? null;
  }

  let winnerParticipantId: string | null = null;
  if (winner) {
    const { data: winningParticipant } = await supabase
      .schema("studio")
      .from("game_session_participants")
      .select("id")
      .eq("session_id", session.id)
      .eq("seat", winner)
      .maybeSingle();

    winnerParticipantId = winningParticipant?.id ?? null;
  }

  const { error: actionError } = await recordOnlineGameAction(supabase, {
    actorUserId: user.id,
    sessionId: session.id,
    participantId: participant.id,
    moveNumber,
    movePayload: {
      type: "memory_match_flip",
      cardId,
      seat,
    },
    resultingState,
    nextTurnParticipantId: completion ? null : nextParticipantId,
    winnerParticipantId,
    sessionStatus: completion ? "completed" : session.status,
    completedAt: completion ? new Date().toISOString() : session.completed_at,
    result: completion
      ? {
          outcome: completion.outcome,
          winnerParticipantId,
          summary: {
            ...completion,
            scores,
            moves,
          },
        }
      : null,
  });

  if (actionError) {
    console.error("Error recording Memory Match action:", actionError);
    return NextResponse.json(
      {
        error:
          actionError.code === "P0001"
            ? "The game changed. Refresh and try again."
            : "Unable to record Memory Match flip.",
      },
      { status: actionError.code === "P0001" ? 409 : 500 },
    );
  }

  const bundle = await getOnlineSessionBundle(supabase, session.id);
  return NextResponse.json({ session: bundle });
}
