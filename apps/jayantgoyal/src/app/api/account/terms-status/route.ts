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

  // Anonymous users don't need to accept terms
  const isAnonymous = user.is_anonymous === true;
  if (isAnonymous) {
    return NextResponse.json({
      needsAcceptance: false,
      isAuthenticated: true,
      isGuest: true,
    });
  }

  // Check if terms are accepted from jg_account.profiles
  const { data: profile } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("terms_accepted")
    .eq("user_id", user.id)
    .single();

  const termsAccepted = profile?.terms_accepted === true;

  return NextResponse.json({
    needsAcceptance: !termsAccepted,
    isAuthenticated: true,
    isGuest: false,
  });
}
