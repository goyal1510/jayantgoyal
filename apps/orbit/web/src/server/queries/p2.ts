import type { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  AutomationRuleSummary,
  GithubLinkSummary,
  PublishedBoardSummary,
} from "@/lib/orbit/types";

type OrbitSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function listBoardAutomationRules(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<AutomationRuleSummary[]> {
  const { data, error } = await supabase.schema("orbit").rpc("list_board_automation_rules", {
    p_board_id: boardId,
  });
  if (error) throw error;
  return (data as AutomationRuleSummary[] | null) ?? [];
}

export async function listCardGithubLinks(
  supabase: OrbitSupabaseClient,
  cardId: string,
): Promise<GithubLinkSummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("card_github_links")
    .select("id, issue_url, issue_title, repo_full_name, issue_number")
    .eq("card_id", cardId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    issueUrl: row.issue_url as string,
    issueTitle: (row.issue_title as string | null) ?? null,
    repoFullName: row.repo_full_name as string,
    issueNumber: row.issue_number as number,
  }));
}

export async function getPublishedBoardForBoard(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<PublishedBoardSummary | null> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("published_boards")
    .select("slug, published_at, revoked_at")
    .eq("board_id", boardId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.revoked_at) return null;
  return {
    slug: data.slug as string,
    publishedAt: data.published_at as string,
  };
}

export async function getPublishedBoardProjection(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_published_board`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      "content-type": "application/json",
      "accept-profile": "orbit",
      "content-profile": "orbit",
    },
    body: JSON.stringify({ p_slug: slug }),
    next: { revalidate: 60 },
  });

  if (!response.ok) return null;
  return response.json();
}

export async function loadBoardReports(
  supabase: OrbitSupabaseClient,
  boardId: string,
) {
  const [completion, backlog, stale] = await Promise.all([
    supabase.schema("orbit").rpc("board_completion_report", {
      p_board_id: boardId,
      p_days: 30,
    }),
    supabase.schema("orbit").rpc("board_backlog_report", { p_board_id: boardId }),
    supabase.schema("orbit").rpc("list_stale_cards", { p_board_id: boardId, p_days: 14 }),
  ]);

  if (completion.error) throw completion.error;
  if (backlog.error) throw backlog.error;
  if (stale.error) throw stale.error;

  return {
    completion: completion.data as Record<string, unknown>,
    backlog: backlog.data as Record<string, unknown>,
    staleCards: (stale.data as Array<Record<string, unknown>> | null) ?? [],
  };
}

export async function listWorkspaceIntegrations(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
) {
  const [webhooks, tokens, deliveries] = await Promise.all([
    supabase.schema("orbit").rpc("list_workspace_webhooks", {
      p_workspace_id: workspaceId,
    }),
    supabase.schema("orbit").rpc("list_workspace_api_tokens", {
      p_workspace_id: workspaceId,
    }),
    supabase.schema("orbit").rpc("list_webhook_deliveries", {
      p_workspace_id: workspaceId,
      p_limit: 25,
    }),
  ]);
  if (webhooks.error) throw webhooks.error;
  if (tokens.error) throw tokens.error;
  if (deliveries.error) throw deliveries.error;
  return {
    webhooks: (webhooks.data as Array<Record<string, unknown>> | null) ?? [],
    tokens: (tokens.data as Array<Record<string, unknown>> | null) ?? [],
    deliveries: (deliveries.data as Array<Record<string, unknown>> | null) ?? [],
  };
}

export async function listWorkspaceExportJobs(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
) {
  const { data, error } = await supabase.schema("orbit").rpc("list_workspace_export_jobs", {
    p_workspace_id: workspaceId,
  });
  if (error) throw error;
  return (data as Array<Record<string, unknown>> | null) ?? [];
}

export async function listBoardImportJobs(
  supabase: OrbitSupabaseClient,
  boardId: string,
) {
  const { data, error } = await supabase.schema("orbit").rpc("list_board_import_jobs", {
    p_board_id: boardId,
  });
  if (error) throw error;
  return (data as Array<Record<string, unknown>> | null) ?? [];
}
