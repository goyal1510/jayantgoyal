import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const guestEmail = process.env.GUEST_EMAIL_LOGIN?.toLowerCase();

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Service role key is not configured." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be signed in to delete the account." },
      { status: 401 }
    );
  }

  const userEmail = user.email?.toLowerCase();
  const userMetadataEmail =
    typeof user.user_metadata?.email === "string"
      ? user.user_metadata.email.toLowerCase()
      : null;
  const isGuestUser =
    !!guestEmail &&
    (userEmail === guestEmail || userMetadataEmail === guestEmail);

  if (isGuestUser) {
    return NextResponse.json(
      { error: "Guest accounts cannot be deleted." },
      { status: 403 }
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Best-effort cookie cleanup; ignore errors.
  }

  return NextResponse.json({ success: true });
}
