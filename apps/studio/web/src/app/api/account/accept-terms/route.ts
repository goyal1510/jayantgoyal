import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkProductAccess } from "@jayantgoyal/web-auth/authorization";
import {
  STUDIO_TERMS_COOKIE,
  STUDIO_TERMS_POLICY_KEY,
  STUDIO_TERMS_VERSION,
} from "@/lib/terms";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const access = await checkProductAccess(supabase, "studio");
  if (!access.allowed) {
    return NextResponse.json(
      { error: "Studio access is not assigned." },
      { status: 403 },
    );
  }

  const { data: policy, error: policyError } = await supabase
    .schema("iam")
    .from("policy_versions")
    .select("id")
    .eq("product_key", "studio")
    .eq("policy_key", STUDIO_TERMS_POLICY_KEY)
    .eq("version", STUDIO_TERMS_VERSION)
    .is("retired_at", null)
    .single();

  if (policyError || !policy) {
    return NextResponse.json(
      { error: "The current Studio terms are unavailable." },
      { status: 503 },
    );
  }

  const { error: acceptanceError } = await supabase
    .schema("iam")
    .from("policy_acceptances")
    .upsert(
      {
        user_id: user.id,
        policy_version_id: policy.id,
        acceptance_source: "web",
      },
      { onConflict: "user_id,policy_version_id", ignoreDuplicates: true },
    );

  if (acceptanceError) {
    return NextResponse.json(
      { error: acceptanceError.message },
      { status: 500 },
    );
  }

  // Set cookie so the proxy can check terms without a DB query on every request
  const res = NextResponse.json({ success: true });
  res.cookies.set(STUDIO_TERMS_COOKIE, STUDIO_TERMS_VERSION, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}
