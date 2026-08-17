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

  const body = await request.json();
  const movePayload = asJsonObject(body?.movePayload);
  const resultingState =
    body?.resultingState === undefined
      ? null
      : asJsonObject(body.resultingState);
  const nextParticipantId =
    typeof body?.nextParticipantId === "string" ? body.nextParticipantId : null;
  const completion = asJsonObject(body?.completion);

  if (Object.keys(movePayload).length === 0) {
    return NextResponse.json(
      { error: "movePayload is required." },
      { status: 400 },
    );
  }

  if (
    !isSafeJsonPayload(movePayload) ||
    !isSafeJsonPayload(resultingState) ||
    !isSafeJsonPayload(completion)
  ) {
    return NextResponse.json(
      { error: "Move payload is too large." },
      { status: 413 },
    );
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: session, error: sessionError } = await supabase
    .schema("studio")
    .from("game_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (session.status !== "active") {
    return NextResponse.json(
      { error: "Session is not active." },
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
      { error: "You have not joined this session." },
      { status: 403 },
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

  if (nextParticipantId) {
    const { data: nextParticipant } = await supabase
      .schema("studio")
      .from("game_session_participants")
      .select("id")
      .eq("id", nextParticipantId)
      .eq("session_id", session.id)
      .is("left_at", null)
      .maybeSingle();

    if (!nextParticipant) {
      return NextResponse.json(
        { error: "Invalid next participant." },
        { status: 400 },
      );
    }
  }

  const moveNumber = (await getCurrentMoveNumber(supabase, session.id)) + 1;
  const completed =
    completion.outcome === "win" ||
    completion.outcome === "draw" ||
    completion.outcome === "abandoned";
  const winnerParticipantId =
    typeof completion.winnerParticipantId === "string"
      ? completion.winnerParticipantId
      : null;

  if (completed) {
    if (winnerParticipantId) {
      const { data: winnerParticipant } = await supabase
        .schema("studio")
        .from("game_session_participants")
        .select("id")
        .eq("id", winnerParticipantId)
        .eq("session_id", session.id)
        .maybeSingle();

      if (!winnerParticipant) {
        return NextResponse.json(
          { error: "Invalid winner participant." },
          { status: 400 },
        );
      }
    }
  }

  const sessionUpdate = {
    state: resultingState ?? session.state,
    current_turn_participant_id: completed ? null : nextParticipantId,
    winner_participant_id: completed
      ? winnerParticipantId
      : session.winner_participant_id,
    status: completed ? "completed" : session.status,
    completed_at: completed ? new Date().toISOString() : session.completed_at,
  };

  const { error: actionError } = await recordOnlineGameAction(supabase, {
    actorUserId: user.id,
    sessionId: session.id,
    participantId: participant.id,
    moveNumber,
    movePayload,
    resultingState: resultingState ?? session.state,
    nextTurnParticipantId: sessionUpdate.current_turn_participant_id,
    winnerParticipantId: sessionUpdate.winner_participant_id,
    sessionStatus: sessionUpdate.status,
    completedAt: sessionUpdate.completed_at,
    result: completed
      ? {
          outcome: completion.outcome,
          winnerParticipantId,
          summary: completion,
        }
      : null,
  });

  if (actionError) {
    console.error("Error recording game action:", actionError);
    return NextResponse.json(
      {
        error:
          actionError.code === "P0001"
            ? "The game changed. Refresh and try again."
            : "Unable to record move.",
      },
      { status: actionError.code === "P0001" ? 409 : 500 },
    );
  }

  const bundle = await getOnlineSessionBundle(supabase, session.id);
  return NextResponse.json({ session: bundle });
}
