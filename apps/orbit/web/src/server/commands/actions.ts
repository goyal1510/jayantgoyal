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

/** Updates editable card fields with optimistic versioning. */
export async function updateCardAction(input: {
  boardId: string;
  cardId: string;
  title?: string;
  description?: string;
  priority?: "none" | "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
  expectedVersion: number;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("update_card", {
    p_card_id: input.cardId,
    p_title: input.title ?? null,
    p_description: input.description ?? null,
    p_priority: input.priority ?? null,
    p_due_date: input.dueDate ?? null,
    p_expected_version: input.expectedVersion,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function trashCardAction(input: {
  boardId: string;
  cardId: string;
  expectedVersion: number;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("trash_card", {
    p_card_id: input.cardId,
    p_expected_version: input.expectedVersion,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function archiveCardAction(input: {
  boardId: string;
  cardId: string;
  expectedVersion: number;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("archive_card", {
    p_card_id: input.cardId,
    p_expected_version: input.expectedVersion,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function createLabelAction(input: {
  workspaceId: string;
  boardId: string;
  name: string;
  colorToken?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("create_label", {
    p_workspace_id: input.workspaceId,
    p_name: input.name,
    p_color_token: input.colorToken ?? "slate",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}

export async function toggleCardLabelAction(input: {
  boardId: string;
  cardId: string;
  labelId: string;
  attach: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("toggle_card_label", {
    p_card_id: input.cardId,
    p_label_id: input.labelId,
    p_attach: input.attach,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function setCardAssigneeAction(input: {
  boardId: string;
  cardId: string;
  userId: string;
  attach: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("set_card_assignee", {
    p_card_id: input.cardId,
    p_user_id: input.userId,
    p_attach: input.attach,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("orbit")
    .rpc("mark_notification_read", { p_notification_id: notificationId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inbox");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("mark_all_notifications_read");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/inbox");
  return { ok: true };
}

export async function uploadCardAttachmentAction(input: {
  boardId: string;
  cardId: string;
  fileName: string;
  mime: string;
  bytes: number;
  fileBase64: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: reservation, error: reserveError } = await supabase
    .schema("orbit")
    .rpc("reserve_attachment_upload", {
      p_card_id: input.cardId,
      p_original_name: input.fileName,
      p_mime: input.mime,
      p_bytes: input.bytes,
    });

  if (reserveError) return { ok: false, error: reserveError.message };

  const payload = reservation as {
    reservation_id: string;
    object_key: string;
    bucket: string;
  };

  const fileBuffer = Buffer.from(input.fileBase64, "base64");
  const { error: uploadError } = await supabase.storage
    .from(payload.bucket)
    .upload(payload.object_key, fileBuffer, {
      contentType: input.mime,
      upsert: false,
    });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { error: finalizeError } = await supabase
    .schema("orbit")
    .rpc("finalize_attachment_upload", {
      p_reservation_id: payload.reservation_id,
    });

  if (finalizeError) return { ok: false, error: finalizeError.message };

  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}
