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

  const guestEmail = process.env.GUEST_EMAIL_LOGIN?.toLowerCase();
  const guestEmailsToMatch = [guestEmail]
    .filter(Boolean)
    .map((value) => (value ?? "").toLowerCase());

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const getString = (value: unknown) => (typeof value === "string" ? value : "");
  const normalize = (value: string | null | undefined) =>
    (value ?? "").trim().toLowerCase();
  const metadataEmail =
    getString(metadata.email) || getString(metadata.preferred_email);
  const firstName = getString(metadata.first_name);
  const lastName = getString(metadata.last_name);
  const combinedName = `${firstName} ${lastName}`.trim();
  const name =
    getString(metadata.full_name) ||
    combinedName ||
    getString(metadata.name) ||
    getString(metadata.user_name) ||
    (user.email ? user.email.split("@")[0] : "");

  const metadataIsGuestValue =
    metadata.is_guest ?? metadata.isGuest ?? metadata.guest;
  const metadataIsGuest =
    metadataIsGuestValue === true ||
    metadataIsGuestValue === "true" ||
    metadataIsGuestValue === 1 ||
    metadataIsGuestValue === "1";

  const isGuest =
    guestEmailsToMatch.some(
      (guest) =>
        !!guest &&
        (normalize(user.email) === guest || normalize(metadataEmail) === guest)
    ) || metadataIsGuest;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name,
      isGuest,
    },
  });
}
