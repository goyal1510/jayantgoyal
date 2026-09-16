import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileDisplayName } from "@jayantgoyal/web-auth/profile";

import type {
  BoardTemplateSummary,
  CardSummary,
  MemberSummary,
} from "@/lib/orbit/types";

type OrbitSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Lists archived or trashed cards for a board. */
export async function listBoardLifecycleCards(
  supabase: OrbitSupabaseClient,
  boardId: string,
  mode: "archived" | "trashed",
): Promise<CardSummary[]> {
  let query = supabase
    .schema("orbit")
    .from("cards")
    .select(
      "id, board_id, column_id, number, title, description, priority, rank, version, due_date, archived_at",
    )
    .eq("board_id", boardId);

  if (mode === "archived") {
    query = query.not("archived_at", "is", null).is("deleted_at", null);
  } else {
    query = query.not("deleted_at", "is", null);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((card) => ({
    id: card.id,
    boardId: card.board_id,
    columnId: card.column_id,
    number: card.number,
    title: card.title,
    description: card.description,
    priority: card.priority,
    rank: card.rank,
    version: card.version,
    dueDate: card.due_date,
    archivedAt: card.archived_at,
  }));
}

/** Lists all workspace members including role and display name. */
export async function listWorkspaceMembersDetailed(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
): Promise<MemberSummary[]> {
  const { data: members, error: memberError } = await supabase
    .schema("orbit")
    .from("workspace_members")
    .select("user_id, role, status")
    .eq("workspace_id", workspaceId)
    .neq("status", "removed");

  if (memberError) throw memberError;
  if (!members?.length) return [];

  const userIds = members.map((member) => member.user_id as string);
  const { data: profiles, error: profileError } = await supabase
    .schema("iam")
    .from("profiles")
    .select("user_id, first_name, last_name")
    .in("user_id", userIds);

  if (profileError) throw profileError;

  const nameByUser = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      profileDisplayName(profile, "Member"),
    ]),
  );

  return members.map((member) => ({
    userId: member.user_id as string,
    role: member.role as string,
    status: member.status as string,
    displayName: nameByUser.get(member.user_id as string) ?? "Member",
  }));
}

/** Returns board ids favorited by the current user in a workspace. */
export async function listFavoriteBoardIds(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("board_favorites")
    .select("board_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.board_id as string);
}

/** Lists board templates saved in a workspace. */
export async function listWorkspaceBoardTemplates(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
): Promise<BoardTemplateSummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("board_templates")
    .select("id, name, description")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((template) => ({
    id: template.id as string,
    name: template.name as string,
    description: (template.description as string | null) ?? null,
  }));
}
