import { NextResponse, type NextRequest } from "next/server"

import { asJsonObject, isSafeJsonPayload, normalizeRoomCode } from "@/lib/games/online-sessions"
import { getCurrentMoveNumber, getOnlineSessionBundle } from "@/lib/games/online-sessions.server"
import {
  isRpsChoice,
  isRpsSeat,
  parseRpsState,
  resolveRpsRound,
  type RpsSeat,
} from "@/lib/games/rock-paper-scissors"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
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
  const movePayload = asJsonObject(body?.movePayload)
  const choice = movePayload.choice

  if (!isRpsChoice(choice) || !isSafeJsonPayload(movePayload)) {
    return NextResponse.json({ error: "A valid choice is required." }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { data: session, error: sessionError } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .eq("game_slug", "rock-paper-scissors")
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: "Rock Paper Scissors room not found." }, { status: 404 })
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Rock Paper Scissors room is not active." }, { status: 409 })
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

  if (!isRpsSeat(participant.seat)) {
    return NextResponse.json({ error: "Invalid player seat." }, { status: 400 })
  }

  const seat = participant.seat as RpsSeat
  const currentState = parseRpsState(session.state)
  if (currentState.pendingChoices[seat]) {
    return NextResponse.json({ error: "You already chose for this round." }, { status: 409 })
  }

  const pendingChoices = {
    ...currentState.pendingChoices,
    [seat]: choice,
  }
  let resultingState = {
    ...currentState,
    pendingChoices,
  }
  let completion: { outcome: "win"; winnerParticipantId: string; winnerSeat: RpsSeat } | null = null

  if (pendingChoices.P1 && pendingChoices.P2) {
    const roundOutcome = resolveRpsRound(pendingChoices.P1, pendingChoices.P2)
    const scores = { ...currentState.scores }
    if (roundOutcome === "draw") scores.draws += 1
    else scores[roundOutcome] += 1

    const winnerSeat = scores.P1 >= currentState.targetWins ? "P1" : scores.P2 >= currentState.targetWins ? "P2" : null
    const { data: winnerParticipant } = winnerSeat
      ? await supabase
          .schema("jg_app")
          .from("game_hub_session_participants")
          .select("id")
          .eq("session_id", session.id)
          .eq("seat", winnerSeat)
          .is("left_at", null)
          .single()
      : { data: null }

    resultingState = {
      ...currentState,
      round: winnerSeat ? currentState.round : currentState.round + 1,
      scores,
      pendingChoices: {},
      lastRound: {
        round: currentState.round,
        choices: {
          P1: pendingChoices.P1,
          P2: pendingChoices.P2,
        },
        outcome: roundOutcome,
      },
    }

    if (winnerSeat && winnerParticipant?.id) {
      completion = {
        outcome: "win",
        winnerParticipantId: winnerParticipant.id,
        winnerSeat,
      }
    }
  }

  const moveNumber = (await getCurrentMoveNumber(supabase, session.id)) + 1
  const { error: moveError } = await supabase
    .schema("jg_app")
    .from("game_hub_session_moves")
    .insert({
      session_id: session.id,
      participant_id: participant.id,
      move_number: moveNumber,
      move_payload: {
        type: "rps_choice",
        round: currentState.round,
        seat,
        choice,
      },
      resulting_state: resultingState,
    })

  if (moveError) {
    console.error("Error recording Rock Paper Scissors choice:", moveError)
    return NextResponse.json({ error: "Unable to record Rock Paper Scissors choice." }, { status: 500 })
  }

  if (completion) {
    await supabase.schema("jg_app").from("game_hub_session_results").upsert({
      session_id: session.id,
      winner_participant_id: completion.winnerParticipantId,
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
      current_turn_participant_id: null,
      winner_participant_id: completion?.winnerParticipantId ?? session.winner_participant_id,
      status: completion ? "completed" : session.status,
      completed_at: completion ? new Date().toISOString() : session.completed_at,
    })
    .eq("id", session.id)

  const bundle = await getOnlineSessionBundle(supabase, session.id)
  return NextResponse.json({ session: bundle })
}
