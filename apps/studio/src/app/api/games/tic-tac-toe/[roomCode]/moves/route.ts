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
  getTicTacToeWinner,
  isTicTacToeBoardFull,
  nextTicTacToeMark,
  parseTicTacToeState,
  type TicTacToeMark,
} from "@/lib/games/tic-tac-toe";
import { createSupabaseServiceRoleClient } from "@repo/auth/service-role";
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
  const rawCell = movePayload.cell;

  if (
    typeof rawCell !== "number" ||
    !Number.isInteger(rawCell) ||
    rawCell < 0 ||
    rawCell > 8 ||
    !isSafeJsonPayload(movePayload)
  ) {
    return NextResponse.json(
      { error: "A valid cell is required." },
      { status: 400 },
    );
  }

  const cell = rawCell;

  const supabase = createSupabaseServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .eq("game_slug", "tic-tac-toe")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Tic Tac Toe room not found." },
      { status: 404 },
    );
  }

  if (session.status !== "active") {
    return NextResponse.json(
      { error: "Tic Tac Toe room is not active." },
      { status: 409 },
    );
  }

  const { data: participant } = await supabase
    .schema("jg_app")
    .from("game_hub_session_participants")
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

  const mark =
    participant.seat === "X" || participant.seat === "O"
      ? (participant.seat as TicTacToeMark)
      : null;
  const currentState = parseTicTacToeState(session.state);

  if (!mark || mark !== currentState.currentPlayer) {
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

  if (currentState.winner || currentState.isDraw || currentState.board[cell]) {
    return NextResponse.json(
      { error: "That cell is not playable." },
      { status: 400 },
    );
  }

  const board = [...currentState.board];
  board[cell] = mark;
  const winner = getTicTacToeWinner(board);
  const isDraw = !winner && isTicTacToeBoardFull(board);
  const nextMark = nextTicTacToeMark(mark);
  const { data: nextParticipant } = await supabase
    .schema("jg_app")
    .from("game_hub_session_participants")
    .select("id")
    .eq("session_id", session.id)
    .eq("seat", nextMark)
    .is("left_at", null)
    .maybeSingle();

  const resultingState = {
    board,
    currentPlayer: winner || isDraw ? mark : nextMark,
    winner: winner?.winner ?? null,
    isDraw,
    lastMove: { cell, mark },
    winningLine: winner?.winningLine ?? [],
  };
  const moveNumber = (await getCurrentMoveNumber(supabase, session.id)) + 1;
  const completion = winner
    ? {
        outcome: "win",
        winnerParticipantId: participant.id,
        winner: winner.winner,
      }
    : isDraw
      ? { outcome: "draw" }
      : null;

  const { error: actionError } = await recordOnlineGameAction(supabase, {
    sessionId: session.id,
    participantId: participant.id,
    moveNumber,
    movePayload: {
      type: "tic_tac_toe_move",
      cell,
      mark,
    },
    resultingState,
    nextTurnParticipantId: completion ? null : (nextParticipant?.id ?? null),
    winnerParticipantId:
      completion?.outcome === "win"
        ? participant.id
        : session.winner_participant_id,
    sessionStatus: completion ? "completed" : session.status,
    completedAt: completion ? new Date().toISOString() : session.completed_at,
    result: completion
      ? {
          outcome: completion.outcome,
          winnerParticipantId:
            completion.outcome === "win" ? participant.id : null,
          summary: completion,
        }
      : null,
  });

  if (actionError) {
    console.error("Error recording Tic Tac Toe action:", actionError);
    return NextResponse.json(
      {
        error:
          actionError.code === "P0001"
            ? "The game changed. Refresh and try again."
            : "Unable to record Tic Tac Toe move.",
      },
      { status: actionError.code === "P0001" ? 409 : 500 },
    );
  }

  const bundle = await getOnlineSessionBundle(supabase, session.id);
  return NextResponse.json({ session: bundle });
}
