import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Combined init endpoint — returns profile + terms status in one call.
 * Uses the proxy-verified x-user-id header to skip a redundant getUser() call.
 * Falls back to getUser() if the header is missing (direct API call).
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // Trust proxy-verified headers (set by proxy after getUser())
  let userId = request.headers.get("x-user-id");
  let userEmail = request.headers.get("x-user-email") ?? undefined;

  if (!userId) {
    // Fallback: called directly without proxy (e.g., during development)
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({
        user: null,
        isAuthenticated: false,
        needsAcceptance: false,
      });
    }
    userId = user.id;
    userEmail = user.email;
  }

  // Single DB query: profile + terms
  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("first_name, last_name, terms_accepted")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({
      user: null,
      isAuthenticated: true,
      needsAcceptance: true,
    });
  }

  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  const termsAccepted = profile.terms_accepted === true;

  const res = NextResponse.json({
    user: { id: userId, name: name || "User", email: userEmail },
    isAuthenticated: true,
    needsAcceptance: !termsAccepted,
  });

  if (termsAccepted) {
    res.cookies.set("terms_accepted", "true", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
}
