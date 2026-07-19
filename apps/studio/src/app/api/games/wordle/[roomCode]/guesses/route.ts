import { NextResponse, type NextRequest } from "next/server"

import { asJsonObject, isSafeJsonPayload, normalizeRoomCode } from "@/lib/games/online-sessions"
import { getCurrentMoveNumber, getOnlineSessionBundle } from "@/lib/games/online-sessions.server"
import {
  evaluateWordleGuess,
  normalizeWordleGuess,
  parseWordleState,
  wordleStateToJson,
  type WordleSeat,
} from "@/lib/games/wordle"
import { getWordleSolutionForSession } from "@/lib/games/wordle.server"
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
  const movePayload = asJsonObject(body?.movePayload)
  const guess = normalizeWordleGuess(movePayload.guess)

  if (!guess || !isSafeJsonPayload(movePayload)) {
    return NextResponse.json({ error: "A valid 5-letter word is required." }, { status: 400 })
  }

  const supabase = createSupabaseServiceRoleClient()
  const { data: session, error: sessionError } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("*")
    .eq("room_code", roomCode)
    .eq("game_slug", "wordle")
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: "Wordle room not found." }, { status: 404 })
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Wordle room is not active." }, { status: 409 })
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

  const seat = participant.seat === "P1" || participant.seat === "P2"
    ? participant.seat as WordleSeat
    : null
  if (!seat) {
    return NextResponse.json({ error: "Invalid Wordle seat." }, { status: 403 })
  }

  const currentState = parseWordleState(session.state)
  const playerState = currentState.players[seat]
  if (playerState.done || currentState.winner || currentState.isDraw) {
    return NextResponse.json({ error: "Your Wordle challenge is already complete." }, { status: 409 })
  }

  if (playerState.guesses.length >= currentState.maxGuesses) {
    return NextResponse.json({ error: "No guesses remain." }, { status: 409 })
  }

  const solution = getWordleSolutionForSession(session.id)
  const states = evaluateWordleGuess(guess, solution)
  const won = states.every((state) => state === "correct")
  const guesses = [...playerState.guesses, { word: guess, states }]
  const done = won || guesses.length >= currentState.maxGuesses
  const nextPlayers = {
    ...currentState.players,
    [seat]: {
      guesses,
      won,
      done,
    },
  }
  const allDone = nextPlayers.P1.done && nextPlayers.P2.done
  const isDraw = !won && allDone
  const resultingState = wordleStateToJson({
    ...currentState,
    players: nextPlayers,
    winner: won ? seat : currentState.winner,
    isDraw,
    lastGuess: { seat, word: guess, won },
  })
  const moveNumber = (await getCurrentMoveNumber(supabase, session.id)) + 1
  const completion = won
    ? { outcome: "win", winner: seat, solution }
    : isDraw
      ? { outcome: "draw", solution }
      : null

  const { error: moveError } = await supabase
    .schema("jg_app")
    .from("game_hub_session_moves")
    .insert({
      session_id: session.id,
      participant_id: participant.id,
      move_number: moveNumber,
      move_payload: {
        type: "wordle_guess",
        guess,
        seat,
      },
      resulting_state: resultingState,
    })

  if (moveError) {
    console.error("Error recording Wordle guess:", moveError)
    return NextResponse.json({ error: "Unable to record Wordle guess." }, { status: 500 })
  }

  if (completion) {
    await supabase.schema("jg_app").from("game_hub_session_results").upsert({
      session_id: session.id,
      winner_participant_id: won ? participant.id : null,
      outcome: completion.outcome,
      summary: {
        ...completion,
        guesses: guesses.length,
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
      current_turn_participant_id: null,
      winner_participant_id: won ? participant.id : session.winner_participant_id,
      status: completion ? "completed" : session.status,
      completed_at: completion ? new Date().toISOString() : session.completed_at,
    })
    .eq("id", session.id)

  const bundle = await getOnlineSessionBundle(supabase, session.id)
  return NextResponse.json({ session: bundle })
}
