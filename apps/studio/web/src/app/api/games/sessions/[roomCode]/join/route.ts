import { NextResponse, type NextRequest } from "next/server";

import {
  getSeatForIndex,
  normalizeDisplayName,
  normalizeRoomCode,
} from "@/lib/games/online-sessions";
import { getOnlineSessionBundle } from "@/lib/games/online-sessions.server";
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

  const body = await request.json().catch(() => ({}));
  const displayName = normalizeDisplayName(
    body?.displayName,
    user.email?.split("@")[0] ?? "Player",
  );
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

  if (session.status !== "waiting" && session.status !== "active") {
    return NextResponse.json(
      { error: "This session is no longer joinable." },
      { status: 409 },
    );
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "This session has expired." },
      { status: 410 },
    );
  }

  const { data: existingParticipant } = await supabase
    .schema("studio")
    .from("game_session_participants")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingParticipant) {
    await supabase
      .schema("studio")
      .from("game_session_participants")
      .update({
        display_name: displayName,
        last_seen_at: new Date().toISOString(),
        left_at: null,
      })
      .eq("id", existingParticipant.id);

    const bundle = await getOnlineSessionBundle(supabase, session.id);
    return NextResponse.json({ session: bundle });
  }

  const { data: activeParticipants, error: participantsError } = await supabase
    .schema("studio")
    .from("game_session_participants")
    .select("seat")
    .eq("session_id", session.id)
    .is("left_at", null)
    .order("joined_at", { ascending: true });

  if (participantsError) {
    console.error("Error loading game participants:", participantsError);
    return NextResponse.json(
      { error: "Unable to load session participants." },
      { status: 500 },
    );
  }

  if ((activeParticipants?.length ?? 0) >= session.max_players) {
    return NextResponse.json(
      { error: "This session is full." },
      { status: 409 },
    );
  }

  const usedSeats = new Set(
    (activeParticipants ?? []).map((participant) => participant.seat),
  );
  let nextSeat = getSeatForIndex(
    session.game_slug,
    activeParticipants?.length ?? 0,
  );
  for (
    let index = 0;
    usedSeats.has(nextSeat) && index < session.max_players;
    index++
  ) {
    nextSeat = getSeatForIndex(session.game_slug, index);
  }

  const { error: joinError } = await supabase
    .schema("studio")
    .from("game_session_participants")
    .insert({
      session_id: session.id,
      user_id: user.id,
      display_name: displayName,
      seat: nextSeat,
      is_host: false,
    });

  if (joinError) {
    console.error("Error joining game session:", joinError);
    return NextResponse.json(
      { error: "Unable to join session." },
      { status: 500 },
    );
  }

  const nextStatus =
    (activeParticipants?.length ?? 0) + 1 >= session.max_players
      ? "active"
      : "waiting";
  if (nextStatus !== session.status) {
    await supabase
      .schema("studio")
      .from("game_sessions")
      .update({
        status: nextStatus,
        started_at: nextStatus === "active" ? new Date().toISOString() : null,
      })
      .eq("id", session.id);
  }

  const bundle = await getOnlineSessionBundle(supabase, session.id);
  return NextResponse.json({ session: bundle });
}
