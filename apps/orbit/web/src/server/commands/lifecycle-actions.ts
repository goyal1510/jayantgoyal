"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { ActionResult } from "./types";

export async function updateBoardAction(input: {
  boardId: string;
  name?: string;
  description?: string;
  visibility?: "workspace" | "private";
  expectedRevision?: number;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("update_board", {
    p_board_id: input.boardId,
    p_name: input.name ?? null,
    p_description: input.description ?? null,
    p_visibility: input.visibility ?? null,
    p_expected_revision: input.expectedRevision ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  revalidatePath("/home");
  return { ok: true };
}

export async function archiveBoardAction(boardId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("archive_board", {
    p_board_id: boardId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/home");
  return { ok: true };
}

export async function trashBoardAction(boardId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("trash_board", {
    p_board_id: boardId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/home");
  return { ok: true };
}

export async function restoreBoardAction(boardId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("restore_board", {
    p_board_id: boardId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/home");
  return { ok: true };
}

export async function toggleBoardFavoriteAction(input: {
  boardId: string;
  favorite: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("toggle_board_favorite", {
    p_board_id: input.boardId,
    p_favorite: input.favorite,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/home");
  return { ok: true };
}

export async function createColumnAction(input: {
  boardId: string;
  name: string;
  category?: "backlog" | "active" | "done" | "cancelled";
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("create_column", {
    p_board_id: input.boardId,
    p_name: input.name,
    p_category: input.category ?? "active",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}

export async function updateColumnAction(input: {
  boardId: string;
  columnId: string;
  name?: string;
  category?: "backlog" | "active" | "done" | "cancelled";
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("update_column", {
    p_column_id: input.columnId,
    p_name: input.name ?? null,
    p_category: input.category ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function deleteColumnAction(input: {
  boardId: string;
  columnId: string;
  destinationColumnId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("delete_column", {
    p_column_id: input.columnId,
    p_destination_column_id: input.destinationColumnId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function restoreCardAction(input: {
  boardId: string;
  cardId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("restore_card", {
    p_card_id: input.cardId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  revalidatePath(`/boards/${input.boardId}/archive`);
  return { ok: true };
}

export async function unarchiveCardAction(input: {
  boardId: string;
  cardId: string;
  expectedVersion: number;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("unarchive_card", {
    p_card_id: input.cardId,
    p_expected_version: input.expectedVersion,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  revalidatePath(`/boards/${input.boardId}/archive`);
  return { ok: true };
}

export async function updateWorkspaceMemberAction(input: {
  workspaceId: string;
  userId: string;
  role: "admin" | "member" | "viewer" | "guest";
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("update_workspace_member", {
    p_workspace_id: input.workspaceId,
    p_user_id: input.userId,
    p_role: input.role,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/workspaces/${input.workspaceId}/members`);
  return { ok: true };
}

export async function removeWorkspaceMemberAction(input: {
  workspaceId: string;
  userId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("remove_workspace_member", {
    p_workspace_id: input.workspaceId,
    p_user_id: input.userId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/workspaces/${input.workspaceId}/members`);
  return { ok: true };
}

export async function bulkMoveCardsAction(input: {
  boardId: string;
  cardIds: string[];
  targetColumnId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("bulk_move_cards", {
    p_board_id: input.boardId,
    p_card_ids: input.cardIds,
    p_target_column_id: input.targetColumnId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}
