import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user has MFA enrolled — redirect to /mfa-verify instead of target
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const hasVerifiedFactor = factorsData?.totp.some((f) => f.status === "verified");
      if (hasVerifiedFactor) {
        const mfaUrl = next !== "/" ? `/mfa-verify?redirect=${encodeURIComponent(next)}` : "/mfa-verify";
        return NextResponse.redirect(`${origin}${mfaUrl}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/welcome?error=auth`);
}
