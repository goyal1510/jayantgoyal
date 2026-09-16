"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { applicationOrigin } from "@jayantgoyal/web-urls";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; id?: string; inviteUrl?: string; workspaceId?: string }
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

/** Creates a workspace invitation and returns a shareable accept URL. */
export async function createWorkspaceInvitationAction(input: {
  workspaceId: string;
  email: string;
  role?: "member" | "viewer" | "guest";
}): Promise<ActionResult> {
  const token = randomBytes(32).toString("hex");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("create_workspace_invitation", {
    p_workspace_id: input.workspaceId,
    p_email: input.email.trim(),
    p_role: input.role ?? "member",
    p_token_hash: token,
  });

  if (error) return { ok: false, error: error.message };

  const origin = applicationOrigin(
    "orbit",
    process.env.NEXT_PUBLIC_ORBIT_URL,
  );
  const inviteUrl = new URL("/invite/accept", `${origin}/`);
  inviteUrl.searchParams.set("token", token);

  revalidatePath("/home");
  return { ok: true, inviteUrl: inviteUrl.toString() };
}

/** Accepts a pending workspace invitation for the signed-in account. */
export async function acceptWorkspaceInvitationAction(input: {
  token: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("orbit")
    .rpc("accept_workspace_invitation", {
      p_token_hash: input.token.trim(),
    });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/home");
  return { ok: true, workspaceId: data as string };
}
