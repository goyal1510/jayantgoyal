#!/usr/bin/env node

import { createDatabaseBoundaryHttp, databaseAuthHeaders } from "../lib/database-boundary-http.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const { expectStatus, request } = createDatabaseBoundaryHttp(supabaseUrl);
const headers = {
  ...databaseAuthHeaders(serviceRoleKey, "orbit"),
  "content-type": "application/json",
};

const workspaceResponse = await request("/rest/v1/rpc/process_pending_workspace_purges", {
  method: "POST",
  headers,
  body: JSON.stringify({ p_limit: 5 }),
});

const cardResponse = await request("/rest/v1/rpc/process_expired_trashed_cards", {
  method: "POST",
  headers,
  body: JSON.stringify({ p_limit: 100 }),
});

const workspaceCount = await expectStatus(
  workspaceResponse,
  [200],
  "orbit.process_pending_workspace_purges",
);
const cardCount = await expectStatus(
  cardResponse,
  [200],
  "orbit.process_expired_trashed_cards",
);

console.log(`Purged ${workspaceCount ?? 0} workspace(s) and ${cardCount ?? 0} trashed card(s).`);
