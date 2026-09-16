#!/usr/bin/env node

/**
 * Orbit-specific linked database boundary checks. Verifies RLS denies cross-workspace
 * reads and that private orbit_private tables stay unreachable to authenticated users.
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDatabaseBoundaryHttp } from "../lib/database-boundary-http.mjs";

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
const checks = [];

async function tokenFor(email) {
  const response = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password: creds.password }),
  });
  const body = await expectStatus(response, [200], `Sign in ${email}`);
  return body.access_token;
}

async function run(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, ok: false, error: error.message });
    console.error(`FAIL ${name}:`, error.message);
  }
}

await run("viewer cannot read private board in another workspace", async () => {
  const viewerToken = await tokenFor("test6@jayantgoyal.com");
  const foreignBoardId = randomUUID();
  const response = await request(
    `/rest/v1/boards?select=id&id=eq.${foreignBoardId}`,
    {
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${viewerToken}`,
        "accept-profile": "orbit",
      },
    },
  );
  const rows = await expectStatus(response, [200], "orbit.boards");
  if (rows.length !== 0) throw new Error("expected empty result");
});

await run("authenticated user cannot select orbit_private export jobs", async () => {
  const token = await tokenFor("test1@jayantgoyal.com");
  const response = await request("/rest/v1/export_jobs?select=id&limit=1", {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "accept-profile": "orbit_private",
    },
  });
  if (response.status === 200) {
    throw new Error("expected orbit_private export_jobs to be unreachable");
  }
});

await run("guest cannot request workspace export", async () => {
  const token = await tokenFor("test6@jayantgoyal.com");
  const response = await request("/rest/v1/rpc/request_workspace_export", {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "accept-profile": "orbit",
      "content-profile": "orbit",
    },
    body: JSON.stringify({ p_workspace_id: creds.demo.workspaceId }),
  });
  if (response.status < 400) {
    throw new Error("expected export request to be denied for guest");
  }
});

const failed = checks.filter((entry) => !entry.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} Orbit boundary checks passed`);
process.exit(failed.length ? 1 : 0);
