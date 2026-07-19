import { Chess } from "chess.js"
import { NextResponse, type NextRequest } from "next/server"

import { colorToSeat, createChessState, getChessCompletion, parseChessState, seatToColor } from "@/lib/games/chess"
import { asJsonObject, isSafeJsonPayload, normalizeRoomCode } from "@/lib/games/online-sessions"
import { getCurrentMoveNumber, getOnlineSessionBundle } from "@/lib/games/online-sessions.server"
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

  const body = await request.json()
  const movePayload = asJsonObject(body?.movePayload)
  const from = typeof movePayload.from === "string" ? movePayload.from : null
  const to = typeof movePayload.to === "string" ? movePayload.to : null
  const promotion = typeof movePayload.promotion === "string" ? movePayload.promotion : "q"

  if (!from || !to || !isSafeJsonPayload(movePayload)) {
    return NextResponse.json({ error: "A valid chess move is required." }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const { data: session, error: sessionError } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .eq("game_slug", "chess")
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: "Chess room not found." }, { status: 404 })
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Chess room is not active." }, { status: 409 })
  }

  const { data: participant } = await supabase
    .schema("jg_app")
    .from("game_hub_session_participants")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", user.id)
    .is("left_at", null)
    .single()

  if (!participant) {
    return NextResponse.json({ error: "You have not joined this room." }, { status: 403 })
  }

  const participantColor = seatToColor(participant.seat)
  const currentState = parseChessState(session.state)
  const chess = new Chess(currentState.fen)

  if (!participantColor || participantColor !== chess.turn()) {
    return NextResponse.json({ error: "It is not your turn." }, { status: 409 })
  }

  if (session.current_turn_participant_id && session.current_turn_participant_id !== participant.id) {
    return NextResponse.json({ error: "It is not your turn." }, { status: 409 })
  }

  const move = (() => {
    try {
      return chess.move({ from, to, promotion })
    } catch {
      return null
    }
  })()
  if (!move) {
    return NextResponse.json({ error: "Illegal chess move." }, { status: 400 })
  }

  const nextSeat = colorToSeat(chess.turn())
  const { data: nextParticipant } = await supabase
    .schema("jg_app")
    .from("game_hub_session_participants")
    .select("id")
    .eq("session_id", session.id)
    .eq("seat", nextSeat)
    .is("left_at", null)
    .maybeSingle()

  const resultingState = createChessState(chess, {
    from: move.from,
    to: move.to,
    san: move.san,
  })
  const winnerParticipantId = chess.isCheckmate() ? participant.id : null
  const completion = getChessCompletion(chess, winnerParticipantId)
  const moveNumber = (await getCurrentMoveNumber(supabase, session.id)) + 1

  const { error: moveError } = await supabase
    .schema("jg_app")
    .from("game_hub_session_moves")
    .insert({
      session_id: session.id,
      participant_id: participant.id,
      move_number: moveNumber,
      move_payload: {
        type: "chess_move",
        from: move.from,
        to: move.to,
        san: move.san,
        beforeFen: move.before,
        afterFen: move.after,
        promotion: move.promotion ?? null,
      },
      resulting_state: resultingState,
    })

  if (moveError) {
    console.error("Error recording chess move:", moveError)
    return NextResponse.json({ error: "Unable to record chess move." }, { status: 500 })
  }

  if (completion) {
    await supabase.schema("jg_app").from("game_hub_session_results").upsert({
      session_id: session.id,
      winner_participant_id: completion.outcome === "win" ? winnerParticipantId : null,
      outcome: completion.outcome,
      summary: completion,
    }, {
      onConflict: "session_id",
    })
  }

  await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .update({
      state: resultingState,
      current_turn_participant_id: completion ? null : nextParticipant?.id ?? null,
      winner_participant_id: completion?.outcome === "win" ? winnerParticipantId : session.winner_participant_id,
      status: completion ? "completed" : session.status,
      completed_at: completion ? new Date().toISOString() : session.completed_at,
    })
    .eq("id", session.id)

  const bundle = await getOnlineSessionBundle(supabase, session.id)
  return NextResponse.json({ session: bundle })
}
