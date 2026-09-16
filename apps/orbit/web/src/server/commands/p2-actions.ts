"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listCardGithubLinks } from "@/server/queries/p2";

import type { ActionResult } from "./types";
import type { GithubLinkSummary } from "@/lib/orbit/types";

export async function loadCardGithubLinksAction(
  cardId: string,
): Promise<{ ok: true; links: GithubLinkSummary[] } | { ok: false; error: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const links = await listCardGithubLinks(supabase, cardId);
    return { ok: true, links };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load GitHub links",
    };
  }
}

export async function removeCardDependencyAction(input: {
  boardId: string;
  dependencyId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("remove_card_dependency", {
    p_dependency_id: input.dependencyId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function setCardRecurrenceDetailedAction(input: {
  boardId: string;
  cardId: string;
  cadence: "daily" | "weekly" | "monthly";
  intervalCount?: number;
  timezone?: string;
  titleTemplate?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("set_card_recurrence", {
    p_card_id: input.cardId,
    p_cadence: input.cadence,
    p_interval_count: input.intervalCount ?? 1,
    p_timezone: input.timezone ?? "UTC",
    p_title_template: input.titleTemplate ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function pauseCardRecurrenceAction(input: {
  boardId: string;
  cardId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("pause_card_recurrence", {
    p_card_id: input.cardId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function resumeCardRecurrenceAction(input: {
  boardId: string;
  cardId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("resume_card_recurrence", {
    p_card_id: input.cardId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function createAutomationRuleAction(input: {
  boardId: string;
  name: string;
  columnId: string;
  labelId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("create_automation_rule", {
    p_board_id: input.boardId,
    p_name: input.name,
    p_trigger_type: "card_moved",
    p_trigger_config: { column_id: input.columnId },
    p_action_type: "set_label",
    p_action_config: { label_id: input.labelId },
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}/settings`);
  return { ok: true };
}

export async function deleteAutomationRuleAction(input: {
  boardId: string;
  ruleId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("delete_automation_rule", {
    p_rule_id: input.ruleId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}/settings`);
  return { ok: true };
}

export async function linkGithubIssueAction(input: {
  boardId: string;
  cardId: string;
  issueUrl: string;
  issueTitle?: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("link_card_github_issue", {
    p_card_id: input.cardId,
    p_issue_url: input.issueUrl.trim(),
    p_issue_title: input.issueTitle ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function unlinkGithubLinkAction(input: {
  boardId: string;
  linkId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("unlink_card_github_link", {
    p_link_id: input.linkId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true };
}

export async function createWebhookSubscriptionAction(input: {
  workspaceId: string;
  url: string;
}): Promise<ActionResult & { secret?: string }> {
  const secret = randomBytes(24).toString("hex");
  const secretHash = createHash("sha256").update(secret).digest("hex");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("create_webhook_subscription", {
    p_workspace_id: input.workspaceId,
    p_url: input.url.trim(),
    p_secret_hash: secretHash,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/workspaces/${input.workspaceId}/settings`);
  return { ok: true, secret };
}

export async function revokeWebhookSubscriptionAction(input: {
  workspaceId: string;
  subscriptionId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("revoke_webhook_subscription", {
    p_subscription_id: input.subscriptionId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/workspaces/${input.workspaceId}/settings`);
  return { ok: true };
}

export async function createApiTokenAction(input: {
  workspaceId: string;
  name: string;
}): Promise<ActionResult & { token?: string }> {
  const token = `orb_${randomBytes(24).toString("hex")}`;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const tokenPrefix = token.slice(0, 12);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("create_api_token", {
    p_workspace_id: input.workspaceId,
    p_name: input.name.trim(),
    p_token_hash: tokenHash,
    p_token_prefix: tokenPrefix,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/workspaces/${input.workspaceId}/settings`);
  return { ok: true, token };
}

export async function revokeApiTokenAction(input: {
  workspaceId: string;
  tokenId: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("revoke_api_token", {
    p_token_id: input.tokenId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/workspaces/${input.workspaceId}/settings`);
  return { ok: true };
}

export async function publishBoardAction(input: {
  boardId: string;
  slug: string;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("publish_board", {
    p_board_id: input.boardId,
    p_slug: input.slug.trim(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}/settings`);
  return { ok: true };
}

export async function revokePublishedBoardAction(boardId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("revoke_published_board", {
    p_board_id: boardId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${boardId}/settings`);
  return { ok: true };
}

export async function requestBoardImportAction(input: {
  boardId: string;
  payload: Record<string, unknown>;
}): Promise<ActionResult & { jobId?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("request_board_import", {
    p_board_id: input.boardId,
    p_payload: input.payload,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}/settings`);
  return { ok: true, jobId: data as string };
}

export async function setAiPreferenceAction(input: {
  workspaceId: string;
  enabled: boolean;
}): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("orbit").rpc("set_ai_preference", {
    p_workspace_id: input.workspaceId,
    p_enabled: input.enabled,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/workspaces/${input.workspaceId}/settings`);
  return { ok: true };
}

export async function summarizeCardAction(input: {
  boardId: string;
  cardId: string;
}): Promise<ActionResult & { summary?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema("orbit").rpc("summarize_card", {
    p_card_id: input.cardId,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/boards/${input.boardId}`);
  return { ok: true, summary: data as string };
}
