"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

/** Creates a workspace when the caller holds orbit.workspace.create. */
export async function createWorkspaceAction(input: {
  name: string;
  description?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("create_workspace", {
    p_name: input.name,
    p_description: input.description ?? null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/home");
  return { ok: true, id: data as string };
}

/** Creates a board with default columns inside a workspace. */
export async function createBoardAction(input: {
  workspaceId: string;
  name: string;
  key: string;
  visibility?: "workspace" | "private";
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("create_board", {
    p_workspace_id: input.workspaceId,
    p_name: input.name,
    p_key: input.key.toUpperCase(),
    p_visibility: input.visibility ?? "workspace",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/home");
  revalidatePath(`/boards/${data}`);
  return { ok: true, id: data as string };
}

/** Creates a card in the requested column. */
export async function createCardAction(input: {
  boardId: string;
  columnId: string;
  title: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("create_card", {
    p_board_id: input.boardId,
    p_column_id: input.columnId,
    p_title: input.title,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}

/** Moves a card between columns using rank ordering and optimistic versioning. */
export async function moveCardAction(input: {
  boardId: string;
  cardId: string;
  targetColumnId: string;
  rank: string;
  expectedVersion: number;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("move_card", {
    p_card_id: input.cardId,
    p_target_column_id: input.targetColumnId,
    p_rank: input.rank,
    p_expected_version: input.expectedVersion,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

/** Appends a comment to a card when the caller can read the board. */
export async function addCommentAction(input: {
  boardId: string;
  cardId: string;
  body: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("add_comment", {
    p_card_id: input.cardId,
    p_body: input.body,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}
