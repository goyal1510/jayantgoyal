import { Chess } from "chess.js";
import { NextResponse, type NextRequest } from "next/server";

import {
  colorToSeat,
  createChessState,
  getChessCompletion,
  parseChessState,
  seatToColor,
} from "@/lib/games/chess";
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
import { createSupabaseServiceRoleClient } from "@jayant/web-auth/service-role";
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

  const body = await request.json();
  const movePayload = asJsonObject(body?.movePayload);
  const from = typeof movePayload.from === "string" ? movePayload.from : null;
  const to = typeof movePayload.to === "string" ? movePayload.to : null;
  const promotion =
    typeof movePayload.promotion === "string" ? movePayload.promotion : "q";

  if (!from || !to || !isSafeJsonPayload(movePayload)) {
    return NextResponse.json(
      { error: "A valid chess move is required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .eq("game_slug", "chess")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Chess room not found." },
      { status: 404 },
    );
  }

  if (session.status !== "active") {
    return NextResponse.json(
      { error: "Chess room is not active." },
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

  const participantColor = seatToColor(participant.seat);
  const currentState = parseChessState(session.state);
  const chess = new Chess(currentState.fen);

  if (!participantColor || participantColor !== chess.turn()) {
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

  const move = (() => {
    try {
      return chess.move({ from, to, promotion });
    } catch {
      return null;
    }
  })();
  if (!move) {
    return NextResponse.json({ error: "Illegal chess move." }, { status: 400 });
  }

  const nextSeat = colorToSeat(chess.turn());
  const { data: nextParticipant } = await supabase
    .schema("jg_app")
    .from("game_hub_session_participants")
    .select("id")
    .eq("session_id", session.id)
    .eq("seat", nextSeat)
    .is("left_at", null)
    .maybeSingle();

  const resultingState = createChessState(chess, {
    from: move.from,
    to: move.to,
    san: move.san,
  });
  const winnerParticipantId = chess.isCheckmate() ? participant.id : null;
  const completion = getChessCompletion(chess, winnerParticipantId);
  const moveNumber = (await getCurrentMoveNumber(supabase, session.id)) + 1;

  const { error: actionError } = await recordOnlineGameAction(supabase, {
    sessionId: session.id,
    participantId: participant.id,
    moveNumber,
    movePayload: {
      type: "chess_move",
      from: move.from,
      to: move.to,
      san: move.san,
      beforeFen: move.before,
      afterFen: move.after,
      promotion: move.promotion ?? null,
    },
    resultingState,
    nextTurnParticipantId: completion ? null : (nextParticipant?.id ?? null),
    winnerParticipantId:
      completion?.outcome === "win"
        ? winnerParticipantId
        : session.winner_participant_id,
    sessionStatus: completion ? "completed" : session.status,
    completedAt: completion ? new Date().toISOString() : session.completed_at,
    result: completion
      ? {
          outcome: completion.outcome,
          winnerParticipantId:
            completion.outcome === "win" ? winnerParticipantId : null,
          summary: completion,
        }
      : null,
  });

  if (actionError) {
    console.error("Error recording chess action:", actionError);
    return NextResponse.json(
      {
        error:
          actionError.code === "P0001"
            ? "The game changed. Refresh and try again."
            : "Unable to record chess move.",
      },
      { status: actionError.code === "P0001" ? 409 : 500 },
    );
  }

  const bundle = await getOnlineSessionBundle(supabase, session.id);
  return NextResponse.json({ session: bundle });
}
