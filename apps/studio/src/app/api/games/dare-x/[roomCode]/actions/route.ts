import { NextResponse, type NextRequest } from "next/server"

import {
  getAvailableDaresForSeat,
  isDareXAction,
  parseDareXState,
  pickDareForSeat,
  type DareXHistoryEntry,
} from "@/lib/games/dare-x"
import { asJsonObject, normalizeRoomCode } from "@/lib/games/online-sessions"
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

  const body = await request.json().catch(() => ({}))
  const payload = asJsonObject(body)
  const action = payload.action
  if (!isDareXAction(action)) {
    return NextResponse.json({ error: "Invalid Dare X action." }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const { data: session, error: sessionError } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .eq("game_slug", "dare-x")
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: "Dare X room not found." }, { status: 404 })
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Dare X room is not active." }, { status: 409 })
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

  const state = parseDareXState(session.state)
  if (participant.seat !== state.currentSeat) {
    return NextResponse.json({ error: "It is not your turn." }, { status: 409 })
  }

  const { data: participants } = await supabase
    .schema("jg_app")
    .from("game_hub_session_participants")
    .select("id, display_name, seat")
    .eq("session_id", session.id)
    .is("left_at", null)
    .order("joined_at", { ascending: true })

  const activeParticipants = participants ?? []
  const currentIndex = activeParticipants.findIndex((item) => item.seat === participant.seat)
  const nextParticipant = activeParticipants[(currentIndex + 1) % activeParticipants.length] ?? activeParticipants[0]
  let resultingState = state
  let completion: { outcome: "draw"; totalTurns: number } | null = null

  if (action === "get_dare") {
    if (state.currentDare) {
      return NextResponse.json({ error: "Resolve the current dare first." }, { status: 409 })
    }

    resultingState = {
      ...state,
      currentDare: pickDareForSeat(state, participant.seat),
    }
  } else {
    if (!state.currentDare) {
      return NextResponse.json({ error: "Get a dare first." }, { status: 409 })
    }

    const entry: DareXHistoryEntry = {
      id: crypto.randomUUID(),
      seat: participant.seat,
      playerName: participant.display_name,
      dare: state.currentDare,
      status: action,
      createdAt: new Date().toISOString(),
    }
    const currentCompleted = state.completed[participant.seat] ?? { done: [], skipped: [] }
    const nextCompleted = {
      ...state.completed,
      [participant.seat]: {
        done: action === "done" ? [...currentCompleted.done, state.currentDare] : currentCompleted.done,
        skipped: action === "not_done" ? [...currentCompleted.skipped, state.currentDare] : currentCompleted.skipped,
      },
    }
    const nextHistory = [entry, ...state.history].slice(0, 100)
    const completedByTurns = nextHistory.length >= state.targetRounds
    const allSeatsFinished = activeParticipants.length > 0 && activeParticipants.every((item) => getAvailableDaresForSeat({ ...state, completed: nextCompleted }, item.seat).length === 0)

    resultingState = {
      ...state,
      currentSeat: nextParticipant?.seat ?? participant.seat,
      currentDare: null,
      round: state.round + 1,
      completed: nextCompleted,
      history: nextHistory,
    }

    if (completedByTurns || allSeatsFinished) {
      completion = { outcome: "draw", totalTurns: nextHistory.length }
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
        type: "dare_x_action",
        action,
        seat: participant.seat,
        round: state.round,
      },
      resulting_state: resultingState,
    })

  if (moveError) {
    console.error("Error recording Dare X action:", moveError)
    return NextResponse.json({ error: "Unable to record Dare X action." }, { status: 500 })
  }

  if (completion) {
    await supabase.schema("jg_app").from("game_hub_session_results").upsert({
      session_id: session.id,
      winner_participant_id: null,
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
      current_turn_participant_id: completion ? null : action === "get_dare" ? participant.id : nextParticipant?.id ?? null,
      status: completion ? "completed" : session.status,
      completed_at: completion ? new Date().toISOString() : session.completed_at,
    })
    .eq("id", session.id)

  const bundle = await getOnlineSessionBundle(supabase, session.id)
  return NextResponse.json({ session: bundle })
}
