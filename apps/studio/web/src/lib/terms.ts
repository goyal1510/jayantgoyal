import type { SupabaseClient } from "@supabase/supabase-js";

export const STUDIO_TERMS_POLICY_KEY = "terms";
export const STUDIO_TERMS_VERSION = "2026-01-26";
export const STUDIO_TERMS_COOKIE = "terms_accepted";

/** Check acceptance of the exact current Studio policy version. */
export async function hasAcceptedStudioTerms(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: policy, error: policyError } = await supabase
    .schema("iam")
    .from("policy_versions")
    .select("id")
    .eq("product_key", "studio")
    .eq("policy_key", STUDIO_TERMS_POLICY_KEY)
    .eq("version", STUDIO_TERMS_VERSION)
    .is("retired_at", null)
    .single();

  if (policyError || !policy) return false;

  const { data: acceptance, error } = await supabase
    .schema("iam")
    .from("policy_acceptances")
    .select("policy_version_id")
    .eq("user_id", userId)
    .eq("policy_version_id", policy.id)
    .maybeSingle();

  return !error && Boolean(acceptance);
}
