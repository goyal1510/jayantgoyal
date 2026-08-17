import type { SupabaseClient } from "@supabase/supabase-js";

export type CapabilityKey = `${string}.${string}.${string}`;

export interface AccessDecision {
  allowed: boolean;
  error: string | null;
}

/**
 * Evaluate one server-owned IAM capability for the current Supabase session.
 * Database errors fail closed so callers never mistake an unavailable policy
 * service for an authorization grant.
 */
export async function checkCapability(
  supabase: SupabaseClient,
  capability: CapabilityKey,
): Promise<AccessDecision> {
  const { data, error } = await supabase
    .schema("iam")
    .rpc("has_capability", { p_capability_key: capability });

  return {
    allowed: !error && data === true,
    error: error?.message ?? null,
  };
}

/** Evaluate active membership for the current user without trusting JWT roles. */
export async function checkProductAccess(
  supabase: SupabaseClient,
  productKey: string,
): Promise<AccessDecision> {
  const { data, error } = await supabase
    .schema("iam")
    .rpc("has_product_access", { p_product_key: productKey });

  return {
    allowed: !error && data === true,
    error: error?.message ?? null,
  };
}

/** Return the live capability set used to shape authorized application UI. */
export async function listMyCapabilities(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .schema("iam")
    .rpc("list_my_capabilities");

  if (error) {
    return { capabilities: [] as CapabilityKey[], error: error.message };
  }

  return {
    capabilities: (data ?? []).map(
      (row: { capability_key: string }) => row.capability_key as CapabilityKey,
    ),
    error: null,
  };
}
