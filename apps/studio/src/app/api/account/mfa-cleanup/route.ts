import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
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

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Service role key is not configured." },
      { status: 500 }
    );
  }

  const { data: factors, error: listError } =
    await adminClient.auth.admin.mfa.listFactors({ userId: user.id });

  if (listError) {
    return NextResponse.json(
      { error: `Failed to list factors: ${listError.message}` },
      { status: 400 }
    );
  }

  let removed = 0;
  for (const factor of factors.factors) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      const { error } = await adminClient.auth.admin.mfa.deleteFactor({
        userId: user.id,
        id: factor.id,
      });
      if (!error) removed++;
    }
  }

  return NextResponse.json({ success: true, removed });
}
