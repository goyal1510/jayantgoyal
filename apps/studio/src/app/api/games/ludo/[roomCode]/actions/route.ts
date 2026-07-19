import { NextResponse, type NextRequest } from "next/server"

import { asJsonObject, isSafeJsonPayload, normalizeRoomCode } from "@/lib/games/online-sessions"
import { getCurrentMoveNumber, getOnlineSessionBundle } from "@/lib/games/online-sessions.server"
import {
  applyLudoMove,
  applyLudoRoll,
  getLegalLudoMoves,
  isLudoSeat,
  ludoStateToJson,
  parseLudoState,
  type LudoSeat,
} from "@/lib/games/ludo"
import { createSupabaseServiceRoleClient } from "@repo/auth/service-role"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const auth = await createSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomCode: rawRoomCode } = await params
  const roomCode = normalizeRoomCode(rawRoomCode)
  if (!roomCode) {
    return NextResponse.json({ error: "Invalid room code." }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const actionPayload = asJsonObject(body?.actionPayload)
  const action = actionPayload.action

  if ((action !== "roll" && action !== "move") || !isSafeJsonPayload(actionPayload)) {
    return NextResponse.json({ error: "A valid Ludo action is required." }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const { data: session, error: sessionError } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .eq("game_slug", "ludo")
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: "Ludo room not found." }, { status: 404 })
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Ludo room is not active." }, { status: 409 })
  }

  const { data: participant } = await supabase
    .schema("jg_app")
    .from("game_hub_session_participants")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", user.id)
    .is("left_at", null)
    .single()

  if (!participant || !isLudoSeat(participant.seat)) {
    return NextResponse.json({ error: "You have not joined this room." }, { status: 403 })
  }

  const seat = participant.seat as LudoSeat
  const currentState = parseLudoState(session.state)

  if (currentState.winner) {
    return NextResponse.json({ error: "This Ludo room is already complete." }, { status: 409 })
  }

  if (seat !== currentState.currentSeat) {
    return NextResponse.json({ error: "It is not your turn." }, { status: 409 })
  }

  if (session.current_turn_participant_id && session.current_turn_participant_id !== participant.id) {
    return NextResponse.json({ error: "It is not your turn." }, { status: 409 })
  }

  const moveNumber = (await getCurrentMoveNumber(supabase, session.id)) + 1
  let nextState = currentState
  let actionDiceValue: number | null = currentState.diceValue

  if (action === "roll") {
    if (currentState.phase !== "roll" || currentState.diceValue) {
      return NextResponse.json({ error: "Roll is not available right now." }, { status: 409 })
    }
    const rolledDiceValue = Math.floor(Math.random() * 6) + 1
    actionDiceValue = rolledDiceValue
    nextState = applyLudoRoll(currentState, seat, rolledDiceValue)
  } else {
    const tokenId = typeof actionPayload.tokenId === "string" ? actionPayload.tokenId : null
    if (!tokenId || currentState.phase !== "move" || !currentState.diceValue) {
      return NextResponse.json({ error: "A movable token is required." }, { status: 400 })
    }
    if (!getLegalLudoMoves(currentState, seat).includes(tokenId)) {
      return NextResponse.json({ error: "That token cannot move." }, { status: 400 })
    }
    nextState = applyLudoMove(currentState, seat, tokenId)
  }

  const resultingState = ludoStateToJson(nextState)
  const { error: moveError } = await supabase
    .schema("jg_app")
    .from("game_hub_session_moves")
    .insert({
      session_id: session.id,
      participant_id: participant.id,
      move_number: moveNumber,
      move_payload: {
        type: "ludo_action",
        action,
        diceValue: actionDiceValue,
        tokenId: typeof actionPayload.tokenId === "string" ? actionPayload.tokenId : null,
        seat,
      },
      resulting_state: resultingState,
    })

  if (moveError) {
    console.error("Error recording Ludo action:", moveError)
    return NextResponse.json({ error: "Unable to record Ludo action." }, { status: 500 })
  }

  let nextParticipantId: string | null = null
  if (!nextState.winner) {
    const { data: nextParticipant } = await supabase
      .schema("jg_app")
      .from("game_hub_session_participants")
      .select("id")
      .eq("session_id", session.id)
      .eq("seat", nextState.currentSeat)
      .is("left_at", null)
      .maybeSingle()

    nextParticipantId = nextParticipant?.id ?? null
  }

  if (nextState.winner) {
    await supabase.schema("jg_app").from("game_hub_session_results").upsert({
      session_id: session.id,
      winner_participant_id: participant.id,
      outcome: "win",
      summary: {
        outcome: "win",
        winner: nextState.winner,
        targetTokens: nextState.targetTokens,
        turnNumber: nextState.turnNumber,
      },
    }, {
      onConflict: "session_id",
    })
  }

  await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .update({
      state: resultingState,
      current_turn_participant_id: nextState.winner ? null : nextParticipantId,
      winner_participant_id: nextState.winner ? participant.id : session.winner_participant_id,
      status: nextState.winner ? "completed" : session.status,
      completed_at: nextState.winner ? new Date().toISOString() : session.completed_at,
    })
    .eq("id", session.id)

  const bundle = await getOnlineSessionBundle(supabase, session.id)
  return NextResponse.json({ session: bundle })
}
