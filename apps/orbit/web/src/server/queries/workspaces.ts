import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkspaceSummary } from "@/lib/orbit/types";

type OrbitSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Lists workspaces where the current user has active membership. */
export async function listMyWorkspaces(
  supabase: OrbitSupabaseClient,
): Promise<WorkspaceSummary[]> {
  const { data: memberships, error: membershipError } = await supabase
    .schema("orbit")
    .from("workspace_members")
    .select("workspace_id")
    .eq("status", "active");

  if (membershipError) throw membershipError;

  const workspaceIds = (memberships ?? []).map(
    (membership) => membership.workspace_id as string,
  );
  if (workspaceIds.length === 0) return [];

  const { data: workspaces, error } = await supabase
    .schema("orbit")
    .from("workspaces")
    .select("id, name, description, owner_user_id, lifecycle")
    .in("id", workspaceIds)
    .order("name", { ascending: true });

  if (error) throw error;

  return (workspaces ?? []).map((workspace) => ({
    id: workspace.id as string,
    name: workspace.name as string,
    description: (workspace.description as string | null) ?? null,
    ownerUserId: workspace.owner_user_id as string,
    lifecycle: workspace.lifecycle as string,
  }));
}
