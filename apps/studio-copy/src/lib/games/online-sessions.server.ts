import type { SupabaseClient } from "@supabase/supabase-js"

import type { OnlineSessionBundle } from "@/lib/games/online-sessions"

export async function getOnlineSessionBundle(
  supabase: SupabaseClient,
  sessionId: string
): Promise<OnlineSessionBundle | null> {
  const { data: session, error: sessionError } = await supabase
    .schema("jg_app")
    .from("game_hub_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) return null

  const [{ data: participants }, { data: moves }, { data: result }] = await Promise.all([
    supabase
      .schema("jg_app")
      .from("game_hub_session_participants")
      .select("*")
      .eq("session_id", sessionId)
      .is("left_at", null)
      .order("joined_at", { ascending: true }),
    supabase
      .schema("jg_app")
      .from("game_hub_session_moves")
      .select("*")
      .eq("session_id", sessionId)
      .order("move_number", { ascending: true }),
    supabase
      .schema("jg_app")
      .from("game_hub_session_results")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle(),
  ])

  return {
    session,
    participants: participants ?? [],
    moves: moves ?? [],
    result: result ?? null,
  }
}

export async function getCurrentMoveNumber(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  const { data } = await supabase
    .schema("jg_app")
    .from("game_hub_session_moves")
    .select("move_number")
    .eq("session_id", sessionId)
    .order("move_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  return typeof data?.move_number === "number" ? data.move_number : 0
}
