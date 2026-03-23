import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  // Fetch profile from jg_account.profiles
  const { data: profile, error: profileError } = await supabase
    .schema("jg_account")
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    console.warn("Failed to fetch jg_account profile:", profileError.message);
  }

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const combinedName = `${firstName} ${lastName}`.trim();
  const role = profile?.role ?? "user";

  // Fallback chain for display name
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const getString = (value: unknown) => (typeof value === "string" ? value : "");
  const name =
    combinedName ||
    getString(metadata.full_name) ||
    getString(metadata.name) ||
    getString(metadata.user_name) ||
    (user.email ? user.email.split("@")[0] : "Guest");

  // Use Supabase's built-in anonymous user detection
  const isGuest = user.is_anonymous === true;

  // Check if user has verified email (for anonymous → permanent conversion flow)
  const hasVerifiedEmail = Boolean(user.email_confirmed_at || user.confirmed_at);

  // User needs to set password if they:
  // - Were anonymous (is_anonymous could be true or false after email link)
  // - Have a verified email
  // - Don't have identities with a password (checking if they came from anonymous)
  const identities = user.identities || [];
  // If user has verified email but originally was anonymous (no password identity created via signUp)
  // they need to set a password. Anonymous users who link email don't have password until they set it.
  const needsPassword = hasVerifiedEmail && !isGuest && identities.length === 0;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name,
      isGuest,
      hasVerifiedEmail,
      needsPassword,
      role,
    },
  });
}
