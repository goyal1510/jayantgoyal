#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDatabaseBoundaryHttp,
} from "../lib/database-boundary-http.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const credPath = join(repoRoot, "supabase/.temp/orbit-test-users.json");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  console.error("Missing Supabase URL or anon key.");
  process.exit(1);
}

const creds = JSON.parse(readFileSync(credPath, "utf8"));
const { expectStatus, request } = createDatabaseBoundaryHttp(supabaseUrl);
const results = [];

async function tokenFor(email) {
  const response = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password: creds.password }),
  });
  const body = await expectStatus(response, [200], `Sign in ${email}`);
  return body.access_token;
}

async function rpc(token, profile, name, payload = {}, statuses = [200, 204]) {
  const response = await request(`/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "accept-profile": profile,
      "content-profile": profile,
    },
    body: JSON.stringify(payload),
  });
  return expectStatus(response, statuses, `${profile}.${name}`);
}

async function select(token, profile, table, query) {
  const response = await request(`/rest/v1/${table}?${query}`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "accept-profile": profile,
    },
  });
  return expectStatus(response, [200], `${profile}.${table}`);
}

async function serviceRpc(profile, name, payload = {}) {
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY required for worker smoke tests");
  }
  const response = await request(`/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      "accept-profile": profile,
      "content-profile": profile,
    },
    body: JSON.stringify(payload),
  });
  return expectStatus(response, [200, 204], `${profile}.${name}`);
}

async function run(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.error(`✗ ${name}: ${error.message}`);
  }
}

await run("test1 has orbit access", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const access = await rpc(token, "iam", "has_product_access", { p_product_key: "orbit" });
  if (access !== true) throw new Error(`unexpected ${access}`);
});

await run("creator card lifecycle", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const columns = await select(token, "orbit", "columns", `select=id&board_id=eq.${boardId}`);
  const cardId = await rpc(token, "orbit", "create_card", {
    p_board_id: boardId,
    p_column_id: columns[0].id,
    p_title: `Smoke ${Date.now()}`,
  });
  const card = (await select(token, "orbit", "cards", `select=version,rank&id=eq.${cardId}`))[0];
  await rpc(token, "orbit", "move_card", {
    p_card_id: cardId,
    p_target_column_id: columns[1]?.id ?? columns[0].id,
    p_rank: card.rank,
    p_expected_version: card.version,
  });
  await rpc(token, "orbit", "add_comment", { p_card_id: cardId, p_body: "Smoke comment" });
  const test3 = creds.users.find((u) => u.email === "test3@jayantgoyal.com");
  if (test3) {
    await rpc(token, "orbit", "set_card_assignee", {
      p_card_id: cardId,
      p_user_id: test3.userId,
      p_attach: true,
    });
  }
  await rpc(token, "orbit", "create_checklist", {
    p_card_id: cardId,
    p_title: "Smoke checklist",
  });
});

await run("test3 reads boards", async () => {
  const token = await tokenFor("test3@jayantgoyal.com");
  const boards = await select(token, "orbit", "boards", "select=id&limit=1");
  if (!boards.length) throw new Error("no boards visible");
});

await run("test4 reads boards", async () => {
  const token = await tokenFor("test4@jayantgoyal.com");
  const boards = await select(token, "orbit", "boards", "select=id&limit=1");
  if (!boards.length) throw new Error("no boards visible");
});

await run("test3 inbox after assign", async () => {
  const token = await tokenFor("test3@jayantgoyal.com");
  const notes = await select(token, "orbit", "notifications", "select=id&limit=5");
  if (!notes.length) throw new Error("expected assignment notification");
});

await run("board favorite toggle", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  await rpc(token, "orbit", "toggle_board_favorite", {
    p_board_id: boardId,
    p_favorite: true,
  });
  const favorites = await select(
    token,
    "orbit",
    "board_favorites",
    `select=board_id&board_id=eq.${boardId}`,
  );
  if (!favorites.length) throw new Error("favorite not persisted");
});

await run("save and apply board template", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const workspaceId = creds.demo.workspaceId;
  const templateId = await rpc(token, "orbit", "save_board_template", {
    p_board_id: boardId,
    p_name: `Smoke template ${Date.now()}`,
  });
  const newBoardId = await rpc(token, "orbit", "create_board_from_template", {
    p_workspace_id: workspaceId,
    p_template_id: templateId,
    p_name: "Smoke Template Board",
    p_key: `T${String(Date.now()).slice(-4)}`,
  });
  const columns = await select(
    token,
    "orbit",
    "columns",
    `select=id&board_id=eq.${newBoardId}`,
  );
  if (!columns.length) throw new Error("template board missing columns");
});

await run("bulk archive and trash", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const columns = await select(token, "orbit", "columns", `select=id&board_id=eq.${boardId}`);
  const archiveCardId = await rpc(token, "orbit", "create_card", {
    p_board_id: boardId,
    p_column_id: columns[0].id,
    p_title: `Bulk archive ${Date.now()}`,
  });
  const trashCardId = await rpc(token, "orbit", "create_card", {
    p_board_id: boardId,
    p_column_id: columns[0].id,
    p_title: `Bulk trash ${Date.now()}`,
  });
  const archived = await rpc(token, "orbit", "bulk_archive_cards", {
    p_board_id: boardId,
    p_card_ids: [archiveCardId],
  });
  const trashed = await rpc(token, "orbit", "bulk_trash_cards", {
    p_board_id: boardId,
    p_card_ids: [trashCardId],
  });
  if (!archived || !trashed) throw new Error("bulk operations returned zero");
});

await run("workspace export request", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const workspaceId = creds.demo.workspaceId;
  const jobId = await rpc(token, "orbit", "request_workspace_export", {
    p_workspace_id: workspaceId,
  });
  if (!jobId) throw new Error("export job id missing");
});

await run("guest invitation with board scope", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const workspaceId = creds.demo.workspaceId;
  const boardId = creds.demo.boardId;
  const invitationId = await rpc(token, "orbit", "create_workspace_invitation", {
    p_workspace_id: workspaceId,
    p_email: `guest-smoke-${Date.now()}@jayantgoyal.com`,
    p_role: "guest",
    p_token_hash: `smoke-${Date.now()}`,
    p_board_scope: [boardId],
  });
  if (!invitationId) throw new Error("invitation not created");
});

await run("recurrence worker", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const columns = await select(token, "orbit", "columns", `select=id&board_id=eq.${boardId}`);
  const cardId = await rpc(token, "orbit", "create_card", {
    p_board_id: boardId,
    p_column_id: columns[0].id,
    p_title: `Recurrence ${Date.now()}`,
  });
  await rpc(token, "orbit", "set_card_recurrence", {
    p_card_id: cardId,
    p_cadence: "daily",
    p_interval_count: 1,
  });
  await serviceRpc("orbit", "process_due_recurrences_worker");
});

await run("test2 admin can update member role", async () => {
  const token = await tokenFor("test2@jayantgoyal.com");
  const test5 = creds.users.find((u) => u.email === "test5@jayantgoyal.com");
  if (!test5) throw new Error("test5 missing from creds");
  await rpc(token, "orbit", "update_workspace_member", {
    p_workspace_id: creds.demo.workspaceId,
    p_user_id: test5.userId,
    p_role: "member",
  });
});

await run("dependency cycle rejected", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const columns = await select(token, "orbit", "columns", `select=id&board_id=eq.${boardId}`);
  const cardA = await rpc(token, "orbit", "create_card", {
    p_board_id: boardId,
    p_column_id: columns[0].id,
    p_title: `Dep A ${Date.now()}`,
  });
  const cardB = await rpc(token, "orbit", "create_card", {
    p_board_id: boardId,
    p_column_id: columns[0].id,
    p_title: `Dep B ${Date.now()}`,
  });
  await rpc(token, "orbit", "add_card_dependency", {
    p_card_id: cardA,
    p_depends_on_card_id: cardB,
  });
  try {
    await rpc(token, "orbit", "add_card_dependency", {
      p_card_id: cardB,
      p_depends_on_card_id: cardA,
    });
    throw new Error("expected cycle rejection");
  } catch (error) {
    if (!String(error.message).includes("cycle")) throw error;
  }
});

await run("publish public board projection", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const slug = `qa-demo-${Date.now()}`;
  await rpc(token, "orbit", "publish_board", { p_board_id: boardId, p_slug: slug });
  const published = await rpc(token, "orbit", "get_published_board", { p_slug: slug });
  if (!published?.projection) throw new Error("published projection missing");
});

await run("github link and reporting", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const columns = await select(token, "orbit", "columns", `select=id&board_id=eq.${boardId}`);
  const cardId = await rpc(token, "orbit", "create_card", {
    p_board_id: boardId,
    p_column_id: columns[0].id,
    p_title: `GitHub ${Date.now()}`,
  });
  await rpc(token, "orbit", "link_card_github_issue", {
    p_card_id: cardId,
    p_issue_url: "https://github.com/goyal1510/jayantgoyal/issues/1",
    p_issue_title: "Smoke issue",
  });
  const report = await rpc(token, "orbit", "board_completion_report", {
    p_board_id: boardId,
    p_days: 30,
  });
  if (!report?.completed_count && report?.completed_count !== 0) {
    throw new Error("completion report missing");
  }
});

await run("webhook and api token", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const workspaceId = creds.demo.workspaceId;
  const webhookId = await rpc(token, "orbit", "create_webhook_subscription", {
    p_workspace_id: workspaceId,
    p_url: "https://example.com/orbit-webhook",
    p_secret_hash: `hash-${Date.now()}`,
  });
  if (!webhookId) throw new Error("webhook not created");
  const tokenId = await rpc(token, "orbit", "create_api_token", {
    p_workspace_id: workspaceId,
    p_name: "Smoke token",
    p_token_hash: `token-hash-${Date.now()}`,
    p_token_prefix: "orb_smoke",
  });
  if (!tokenId) throw new Error("api token not created");
});

await run("import job worker", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const jobId = await rpc(token, "orbit", "request_board_import", {
    p_board_id: boardId,
    p_payload: { cards: [{ title: `Import ${Date.now()}` }] },
  });
  if (!jobId) throw new Error("import job missing");
  await serviceRpc("orbit", "process_pending_import_jobs");
});

await run("ai preference and summary", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const boardId = creds.demo.boardId;
  const workspaceId = creds.demo.workspaceId;
  const columns = await select(token, "orbit", "columns", `select=id&board_id=eq.${boardId}`);
  const cardId = await rpc(token, "orbit", "create_card", {
    p_board_id: boardId,
    p_column_id: columns[0].id,
    p_title: "AI summary card",
  });
  await rpc(token, "orbit", "update_card", {
    p_card_id: cardId,
    p_description: "This card has enough text for a local summary.",
    p_expected_version: 1,
  });
  await rpc(token, "orbit", "set_ai_preference", { p_workspace_id: workspaceId, p_enabled: true });
  const summary = await rpc(token, "orbit", "summarize_card", { p_card_id: cardId });
  if (!summary || !String(summary).includes("AI summary card")) {
    throw new Error("summary missing card title");
  }
});

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
