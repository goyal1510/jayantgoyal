import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
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

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Service role key is not configured." },
      { status: 500 }
    );
  }

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
