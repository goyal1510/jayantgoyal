import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({
      needsAcceptance: false,
      isAuthenticated: false,
    });
  }

  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("terms_accepted")
    .eq("user_id", user.id)
    .single();

  const termsAccepted = profile?.terms_accepted === true;

  // Set/update cookie so the proxy can skip the DB query on future requests
  const res = NextResponse.json({
    needsAcceptance: !termsAccepted,
    isAuthenticated: true,
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
