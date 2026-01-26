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

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const getString = (value: unknown) => (typeof value === "string" ? value : "");
  const firstName = getString(metadata.first_name);
  const lastName = getString(metadata.last_name);
  const combinedName = `${firstName} ${lastName}`.trim();
  const name =
    getString(metadata.full_name) ||
    combinedName ||
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
  const hasPasswordIdentity = identities.some(
    (identity) => identity.provider === "email" && identity.identity_data?.email
  );

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
    },
  });
}
