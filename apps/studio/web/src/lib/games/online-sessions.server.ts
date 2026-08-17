import type { SupabaseClient } from "@supabase/supabase-js";

import type { OnlineSessionBundle } from "@/lib/games/online-sessions";

export async function getOnlineSessionBundle(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<OnlineSessionBundle | null> {
  const { data: session, error: sessionError } = await supabase
    .schema("studio")
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) return null;

  const [{ data: participants }, { data: moves }, { data: result }] =
    await Promise.all([
      supabase
        .schema("studio")
        .from("game_session_participants")
        .select("*")
        .eq("session_id", sessionId)
        .is("left_at", null)
        .order("joined_at", { ascending: true }),
      supabase
        .schema("studio")
        .from("game_session_moves")
        .select("*")
        .eq("session_id", sessionId)
        .order("move_number", { ascending: true }),
      supabase
        .schema("studio")
        .from("game_session_results")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle(),
    ]);

  return {
    session,
    participants: participants ?? [],
    moves: moves ?? [],
    result: result ?? null,
  };
}

export async function getCurrentMoveNumber(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<number> {
  const { data } = await supabase
    .schema("studio")
    .from("game_session_moves")
    .select("move_number")
    .eq("session_id", sessionId)
    .order("move_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return typeof data?.move_number === "number" ? data.move_number : 0;
}

type GameSessionStatus = "waiting" | "active" | "completed" | "abandoned";

interface RecordOnlineGameActionInput {
  actorUserId: string;
  sessionId: string;
  participantId: string;
  moveNumber: number;
  movePayload: Record<string, unknown>;
  resultingState: Record<string, unknown>;
  nextTurnParticipantId: string | null;
  winnerParticipantId: string | null;
  sessionStatus: GameSessionStatus;
  completedAt: string | null;
  result?: {
    outcome: unknown;
    winnerParticipantId: string | null;
    summary: Record<string, unknown>;
  } | null;
}

export async function recordOnlineGameAction(
  supabase: SupabaseClient,
  input: RecordOnlineGameActionInput,
) {
  const resultOutcome = input.result?.outcome;
  if (
    resultOutcome !== undefined &&
    resultOutcome !== "win" &&
    resultOutcome !== "draw" &&
    resultOutcome !== "abandoned"
  ) {
    throw new Error("Invalid online game result outcome");
  }

  return supabase.schema("studio").rpc("record_game_action", {
    p_actor_user_id: input.actorUserId,
    p_session_id: input.sessionId,
    p_participant_id: input.participantId,
    p_move_number: input.moveNumber,
    p_move_payload: input.movePayload,
    p_resulting_state: input.resultingState,
    p_next_turn_participant_id: input.nextTurnParticipantId,
    p_winner_participant_id: input.winnerParticipantId,
    p_session_status: input.sessionStatus,
    p_completed_at: input.completedAt,
    p_result_outcome: resultOutcome ?? null,
    p_result_winner_participant_id: input.result?.winnerParticipantId ?? null,
    p_result_summary: input.result?.summary ?? null,
  });
}
