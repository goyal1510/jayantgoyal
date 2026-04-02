import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getCurrentSessionId(accessToken: string): string | null {
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    const payload = JSON.parse(Buffer.from(part, "base64").toString());
    return (payload.session_id as string) ?? null;
  } catch {
    return null;
  }
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const currentSessionId = getCurrentSessionId(session.access_token);

  const { data, error } = await adminClient
    .schema("jg_account")
    .rpc("list_user_sessions", { p_user_id: userId });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch sessions." },
      { status: 500 }
    );
  }

  const sessions = ((data as Array<Record<string, unknown>>) ?? []).map(
    (s) => ({
      id: s.id as string,
      createdAt: s.created_at as string,
      updatedAt: s.updated_at as string,
      userAgent: (s.user_agent as string) ?? null,
      ip: (s.ip as string) ?? null,
      isCurrent: s.id === currentSessionId,
    })
  );

  return NextResponse.json({ sessions, currentSessionId });
}

export async function DELETE(request: NextRequest) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const currentSessionId = getCurrentSessionId(session.access_token);

  const body = (await request.json()) as {
    sessionId?: string;
    scope?: "others";
  };

  // --- Revoke all other sessions ---
  if (body.scope === "others") {
    if (!currentSessionId) {
      return NextResponse.json(
        { error: "Could not identify current session." },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .schema("jg_account")
      .rpc("revoke_other_sessions", {
        p_user_id: userId,
        p_current_session_id: currentSessionId,
      });

    if (error) {
      return NextResponse.json(
        { error: "Failed to revoke sessions." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, revoked: data as number });
  }

  // --- Revoke single session ---
  if (body.sessionId) {
    if (body.sessionId === currentSessionId) {
      return NextResponse.json(
        { error: "Cannot revoke your current session. Use sign out instead." },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .schema("jg_account")
      .rpc("revoke_session", {
        p_user_id: userId,
        p_session_id: body.sessionId,
      });

    if (error || data === false) {
      return NextResponse.json(
        { error: "Session not found or already revoked." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: 'Provide "sessionId" or "scope": "others".' },
    { status: 400 }
  );
}
