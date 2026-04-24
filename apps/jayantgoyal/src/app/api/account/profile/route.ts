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
    .select("first_name, last_name")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    console.warn("Failed to fetch jg_account profile:", profileError.message);
  }

  const firstName = profile?.first_name ?? "";
  const lastName = profile?.last_name ?? "";
  const combinedName = `${firstName} ${lastName}`.trim();

  // Fallback chain for display name
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const getString = (value: unknown) => (typeof value === "string" ? value : "");
  const name =
    combinedName ||
    getString(metadata.full_name) ||
    getString(metadata.name) ||
    getString(metadata.user_name) ||
    (user.email ? user.email.split("@")[0] : "User");

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name,
    },
  });
}
