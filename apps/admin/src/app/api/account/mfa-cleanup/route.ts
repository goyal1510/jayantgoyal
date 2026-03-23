import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  // Use Supabase Auth REST API directly to list and delete unverified factors
  const listRes = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${user.id}/factors`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  if (!listRes.ok) {
    const body = await listRes.text();
    return NextResponse.json(
      { error: `Failed to list factors: ${body}` },
      { status: 400 }
    );
  }

  const factors = await listRes.json();

  let removed = 0;
  for (const factor of factors) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      const deleteRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${user.id}/factors/${factor.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        }
      );
      if (deleteRes.ok) removed++;
    }
  }

  return NextResponse.json({ success: true, removed });
}
