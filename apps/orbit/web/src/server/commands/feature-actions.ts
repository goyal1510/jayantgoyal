"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { ActionResult } from "./types";

export async function createChecklistAction(input: {
  boardId: string;
  cardId: string;
  title: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("create_checklist", {
    p_card_id: input.cardId,
    p_title: input.title,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}

export async function addChecklistItemAction(input: {
  boardId: string;
  checklistId: string;
  body: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("add_checklist_item", {
    p_checklist_id: input.checklistId,
    p_body: input.body,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}

export async function toggleChecklistItemAction(input: {
  boardId: string;
  itemId: string;
  completed: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("toggle_checklist_item", {
    p_item_id: input.itemId,
    p_completed: input.completed,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function toggleCardWatchAction(input: {
  boardId: string;
  cardId: string;
  watch: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("toggle_card_watch", {
    p_card_id: input.cardId,
    p_watch: input.watch,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function snoozeCardAction(input: {
  boardId: string;
  cardId: string;
  snoozeUntil: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("snooze_card", {
    p_card_id: input.cardId,
    p_snooze_until: input.snoozeUntil,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function addCardDependencyAction(input: {
  boardId: string;
  cardId: string;
  dependsOnCardId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("add_card_dependency", {
    p_card_id: input.cardId,
    p_depends_on_card_id: input.dependsOnCardId,
    p_dependency_type: "blocks",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}

export async function setCardRecurrenceAction(input: {
  boardId: string;
  cardId: string;
  cadence: "daily" | "weekly" | "monthly";
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("set_card_recurrence", {
    p_card_id: input.cardId,
    p_cadence: input.cadence,
    p_interval_count: 1,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}

export async function createSavedViewAction(input: {
  workspaceId: string;
  boardId: string;
  name: string;
  filters?: Record<string, unknown>;
  isShared?: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("create_saved_view", {
    p_workspace_id: input.workspaceId,
    p_board_id: input.boardId,
    p_name: input.name,
    p_filters: input.filters ?? {},
    p_is_shared: input.isShared ?? false,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, id: data as string };
}

export async function saveBoardTemplateAction(input: {
  boardId: string;
  name: string;
  description?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("save_board_template", {
    p_board_id: input.boardId,
    p_name: input.name,
    p_description: input.description ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}/settings`);
  return { ok: true, id: data as string };
}

export async function getAttachmentDownloadUrlAction(
  attachmentId: string,
): Promise<ActionResult & { url?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: attachment, error } = await supabase
    .schema("orbit")
    .from("attachments")
    .select("object_key, original_name, mime, board_id")
    .eq("id", attachmentId)
    .eq("status", "ready")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!attachment) return { ok: false, error: "Attachment not found" };

  const { data: signed, error: signError } = await supabase.storage
    .from("orbit-attachments")
    .createSignedUrl(attachment.object_key as string, 300, {
      download: attachment.original_name as string,
    });

  if (signError) return { ok: false, error: signError.message };
  return { ok: true, url: signed.signedUrl };
}
