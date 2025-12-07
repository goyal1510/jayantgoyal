import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const guestEmail = process.env.GUEST_EMAIL_LOGIN;
  const guestPassword = process.env.GUEST_PASSWORD_LOGIN;

  if (!guestEmail || !guestPassword) {
    return NextResponse.json(
      { error: "Guest credentials are not configured." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: guestEmail,
    password: guestPassword,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
