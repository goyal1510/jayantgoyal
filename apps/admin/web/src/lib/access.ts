import {
  checkCapability,
  type CapabilityKey,
} from "@jayantgoyal/web-auth/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ADMIN_CAPABILITIES = {
  enter: "admin.console.enter",
  usersRead: "admin.users.read",
  usersCreate: "admin.users.create",
  usersUpdate: "admin.users.update",
  usersDelete: "admin.users.delete",
  deploymentsRead: "admin.deployments.read",
  deploymentsCreate: "admin.deployments.create",
  deploymentsUpdate: "admin.deployments.update",
  portfolioRead: "portfolio.content.read",
  portfolioCreate: "portfolio.content.create",
  portfolioUpdate: "portfolio.content.update",
  portfolioDelete: "portfolio.content.delete",
} as const satisfies Record<string, CapabilityKey>;

export type AdminAccessLevel = "viewer" | "full_access";

/** Authenticate the request and evaluate one live IAM capability. */
export async function authorizeAdminCapability(capability: CapabilityKey) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false as const, status: 401, error: "Unauthorized" };
  }

  const decision = await checkCapability(supabase, capability);
  if (!decision.allowed) {
    return { authorized: false as const, status: 403, error: "Forbidden" };
  }

  return { authorized: true as const, user, supabase };
}

export async function getAdminAccessLevel(
  supabase: Parameters<typeof checkCapability>[0],
): Promise<AdminAccessLevel> {
  const mutationAccess = await checkCapability(
    supabase,
    ADMIN_CAPABILITIES.portfolioUpdate,
  );
  return mutationAccess.allowed ? "full_access" : "viewer";
}
