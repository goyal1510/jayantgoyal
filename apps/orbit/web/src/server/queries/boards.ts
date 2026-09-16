import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileDisplayName } from "@jayantgoyal/web-auth/profile";

import type {
  AttachmentSummary,
  BoardSummary,
  CardSummary,
  ColumnSummary,
  CommentSummary,
  LabelSummary,
  MemberSummary,
} from "@/lib/orbit/types";

type OrbitSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Lists boards visible to the current user within a workspace. */
export async function listWorkspaceBoards(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
): Promise<BoardSummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("boards")
    .select("id, workspace_id, key, name, visibility")
    .eq("workspace_id", workspaceId)
    .eq("lifecycle", "active")
    .order("rank", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((board) => ({
    id: board.id,
    workspaceId: board.workspace_id,
    key: board.key,
    name: board.name,
    visibility: board.visibility,
  }));
}

/** Loads a board shell with columns and active cards for rendering. */
export async function loadBoardView(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<{
  board: BoardSummary | null;
  columns: ColumnSummary[];
  cards: CardSummary[];
}> {
  const { data: board, error: boardError } = await supabase
    .schema("orbit")
    .from("boards")
    .select("id, workspace_id, key, name, visibility")
    .eq("id", boardId)
    .maybeSingle();

  if (boardError) throw boardError;
  if (!board) return { board: null, columns: [], cards: [] };

  const [{ data: columns, error: columnsError }, { data: cards, error: cardsError }] =
    await Promise.all([
      supabase
        .schema("orbit")
        .from("columns")
        .select("id, board_id, name, category, rank")
        .eq("board_id", boardId)
        .order("rank", { ascending: true }),
      supabase
        .schema("orbit")
        .from("cards")
        .select(
          "id, board_id, column_id, number, title, description, priority, rank, version, due_date",
        )
        .eq("board_id", boardId)
        .is("deleted_at", null)
        .is("archived_at", null)
        .order("rank", { ascending: true }),
    ]);

  if (columnsError) throw columnsError;
  if (cardsError) throw cardsError;

  return {
    board: {
      id: board.id,
      workspaceId: board.workspace_id,
      key: board.key,
      name: board.name,
      visibility: board.visibility,
    },
    columns: (columns ?? []).map((column) => ({
      id: column.id,
      boardId: column.board_id,
      name: column.name,
      category: column.category,
      rank: column.rank,
    })),
    cards: (cards ?? []).map((card) => ({
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
    })),
  };
}

/** Lists non-deleted comments for a card ordered oldest first. */
export async function listCardComments(
  supabase: OrbitSupabaseClient,
  cardId: string,
): Promise<CommentSummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("comments")
    .select("id, card_id, author_id, body, created_at")
    .eq("card_id", cardId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((comment) => ({
    id: comment.id,
    cardId: comment.card_id,
    authorId: comment.author_id,
    body: comment.body,
    createdAt: comment.created_at,
  }));
}

/** Lists workspace-scoped labels available for cards. */
export async function listWorkspaceLabels(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
): Promise<LabelSummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("labels")
    .select("id, workspace_id, name, color_token")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((label) => ({
    id: label.id,
    workspaceId: label.workspace_id,
    name: label.name,
    colorToken: label.color_token,
  }));
}

/** Lists active workspace members with display names for assignment UI. */
export async function listWorkspaceMembers(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
): Promise<MemberSummary[]> {
  const { data: members, error: memberError } = await supabase
    .schema("orbit")
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");

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
    displayName: nameByUser.get(member.user_id as string) ?? "Member",
  }));
}

/** Maps card ids to label ids for one board. */
export async function listBoardCardLabelIds(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("card_labels")
    .select("card_id, label_id")
    .eq("board_id", boardId);

  if (error) throw error;

  const grouped: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const cardId = row.card_id as string;
    grouped[cardId] ??= [];
    grouped[cardId].push(row.label_id as string);
  }
  return grouped;
}

/** Maps card ids to assignee user ids for one board. */
export async function listBoardAssigneeIds(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("card_assignees")
    .select("card_id, user_id")
    .eq("board_id", boardId);

  if (error) throw error;

  const grouped: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const cardId = row.card_id as string;
    grouped[cardId] ??= [];
    grouped[cardId].push(row.user_id as string);
  }
  return grouped;
}

/** Lists ready attachments grouped by card for one board. */
export async function listBoardAttachments(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<Record<string, AttachmentSummary[]>> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("attachments")
    .select("id, card_id, original_name, mime, bytes, object_key")
    .eq("board_id", boardId)
    .eq("status", "ready")
    .is("deleted_at", null);

  if (error) throw error;

  const grouped: Record<string, AttachmentSummary[]> = {};
  for (const row of data ?? []) {
    const cardId = row.card_id as string;
    grouped[cardId] ??= [];
    grouped[cardId].push({
      id: row.id as string,
      cardId,
      originalName: row.original_name as string,
      mime: row.mime as string,
      bytes: row.bytes as number,
      objectKey: row.object_key as string,
    });
  }
  return grouped;
}
