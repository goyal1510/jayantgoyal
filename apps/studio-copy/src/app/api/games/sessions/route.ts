import { NextResponse, type NextRequest } from "next/server"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  asJsonObject,
  createRoomCode,
  getMaxPlayersForGame,
  getSeatForIndex,
  isOnlineGameSlug,
  normalizeMaxPlayersForGame,
  normalizeDisplayName,
  normalizeRoomCode,
} from "@/lib/games/online-sessions"
import { getOnlineSessionBundle } from "@/lib/games/online-sessions.server"

export async function GET(request: NextRequest) {
  const auth = await createSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const roomCode = normalizeRoomCode(request.nextUrl.searchParams.get("roomCode"))
  if (!roomCode) {
    return NextResponse.json({ error: "A valid roomCode is required." }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { data: session, error } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("id")
    .eq("room_code", roomCode)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 })
  }

  const { data: participant } = await supabase
    .schema("jg_app")
    .from("game_hub_session_participants")
    .select("id")
    .eq("session_id", session.id)
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle()

  if (!participant) {
    return NextResponse.json({ error: "You have not joined this session." }, { status: 403 })
  }

  const bundle = await getOnlineSessionBundle(supabase, session.id)
  return NextResponse.json({ session: bundle })
}

export async function POST(request: NextRequest) {
  const auth = await createSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { gameSlug, displayName, settings } = body ?? {}

  if (!isOnlineGameSlug(gameSlug)) {
    return NextResponse.json({ error: "Unsupported gameSlug." }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const sessionSettings = asJsonObject(settings)
  const maxPlayers = gameSlug === "dare-x" || gameSlug === "ludo"
    ? normalizeMaxPlayersForGame(gameSlug, sessionSettings.maxPlayers)
    : getMaxPlayersForGame(gameSlug)
  const hostName = normalizeDisplayName(displayName, user.email?.split("@")[0] ?? "Host")
  const initialState = asJsonObject(sessionSettings.initialState)

  for (let attempt = 0; attempt < 5; attempt++) {
    const roomCode = createRoomCode()
    const { data: session, error: sessionError } = await supabase
      .schema("jg_app")
      .from("game_hub_sessions")
      .insert({
        room_code: roomCode,
        game_slug: gameSlug,
        max_players: maxPlayers,
        created_by: user.id,
        settings: sessionSettings,
        state: initialState,
      })
      .select()
      .single()

    if (sessionError) {
      if (sessionError.code === "23505") continue
      console.error("Error creating game session:", sessionError)
      return NextResponse.json({ error: "Unable to create game session." }, { status: 500 })
    }

    const { data: participant, error: participantError } = await supabase
      .schema("jg_app")
      .from("game_hub_session_participants")
      .insert({
        session_id: session.id,
        user_id: user.id,
        display_name: hostName,
        seat: getSeatForIndex(gameSlug, 0),
        is_host: true,
      })
      .select()
      .single()

    if (participantError || !participant) {
      console.error("Error creating host participant:", participantError)
      await supabase.schema("jg_app").from("game_hub_sessions").delete().eq("id", session.id)
      return NextResponse.json({ error: "Unable to create host participant." }, { status: 500 })
    }

    const bundle = await getOnlineSessionBundle(supabase, session.id)
    return NextResponse.json({ session: bundle }, { status: 201 })
  }

  return NextResponse.json({ error: "Unable to generate a unique room code." }, { status: 500 })
}
