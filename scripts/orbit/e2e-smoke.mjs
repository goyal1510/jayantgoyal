#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDatabaseBoundaryHttp,
  databaseAuthHeaders as authHeaders,
} from "../lib/database-boundary-http.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const credPath = join(repoRoot, "supabase/.temp/orbit-test-users.json");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

async function rpc(token, profile, name, payload = {}) {
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
  return expectStatus(response, [200, 204], `${profile}.${name}`);
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

const failed = results.filter((entry) => !entry.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
