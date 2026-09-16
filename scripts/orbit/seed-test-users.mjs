#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDatabaseBoundaryHttp,
  databaseAuthHeaders as authHeaders,
} from "../lib/database-boundary-http.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outputPath = join(repoRoot, "supabase/.temp/orbit-test-users.json");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const testPassword =
  process.env.ORBIT_TEST_USER_PASSWORD ?? "OrbitQaTest2026!Secure";

const TEST_USERS = [
  { email: "test1@jayantgoyal.com", firstName: "Test", lastName: "One", role: "orbit.creator" },
  { email: "test2@jayantgoyal.com", firstName: "Test", lastName: "Two", role: "orbit.participant", workspaceRole: "admin" },
  { email: "test3@jayantgoyal.com", firstName: "Test", lastName: "Three", role: "orbit.participant", workspaceRole: "member" },
  { email: "test4@jayantgoyal.com", firstName: "Test", lastName: "Four", role: "orbit.participant", workspaceRole: "viewer" },
  { email: "test5@jayantgoyal.com", firstName: "Test", lastName: "Five", role: "orbit.participant", workspaceRole: "member" },
  { email: "test6@jayantgoyal.com", firstName: "Test", lastName: "Six", role: "orbit.participant", workspaceRole: "member" },
];

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error("Missing Supabase URL, anon key, or service-role key.");
  process.exit(1);
}

const { expectStatus, request } = createDatabaseBoundaryHttp(supabaseUrl);

async function listAllUsers() {
  const users = [];
  let page = 1;
  while (true) {
    const response = await request(`/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers: authHeaders(serviceRoleKey),
    });
    const body = await expectStatus(response, [200], "List users");
    users.push(...(body.users ?? []));
    if ((body.users ?? []).length < 200) break;
    page += 1;
  }
  return users;
}

async function ensureUser({ email, firstName, lastName, role }) {
  const existing = (await listAllUsers()).find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  let userId = existing?.id;
  if (!userId) {
    const response = await request("/auth/v1/admin/users", {
      method: "POST",
      headers: { ...authHeaders(serviceRoleKey), "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: testPassword,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName, purpose: "orbit-qa" },
      }),
    });
    const created = await expectStatus(response, [200], `Create ${email}`);
    userId = created.id ?? created.user?.id;
    console.log(`Created ${email}`);
  } else {
    await request(`/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: { ...authHeaders(serviceRoleKey), "content-type": "application/json" },
      body: JSON.stringify({ password: testPassword, email_confirm: true }),
    });
    console.log(`Updated ${email}`);
  }

  await request(`/rest/v1/profiles?user_id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(serviceRoleKey, "iam"),
      "content-type": "application/json",
    },
    body: JSON.stringify({ first_name: firstName, last_name: lastName }),
  });

  await request("/rest/v1/product_memberships", {
    method: "POST",
    headers: {
      ...authHeaders(serviceRoleKey, "iam"),
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ product_key: "orbit", user_id: userId, status: "active" }),
  });

  await request(
    `/rest/v1/product_role_assignments?product_key=eq.orbit&user_id=eq.${userId}&role_key=in.(orbit.participant,orbit.creator)`,
    { method: "DELETE", headers: authHeaders(serviceRoleKey, "iam") },
  );

  await request("/rest/v1/product_role_assignments", {
    method: "POST",
    headers: {
      ...authHeaders(serviceRoleKey, "iam"),
      "content-type": "application/json",
    },
    body: JSON.stringify({ product_key: "orbit", user_id: userId, role_key: role }),
  });

  return userId;
}

async function signIn(email) {
  const response = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password: testPassword }),
  });
  const body = await expectStatus(response, [200], `Sign in ${email}`);
  return body.access_token;
}

async function rpc(token, name, payload) {
  const response = await request(`/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "accept-profile": "orbit",
      "content-profile": "orbit",
    },
    body: JSON.stringify(payload),
  });
  return expectStatus(response, [200, 204], `RPC ${name}`);
}

async function select(token, table, query, profile = "orbit") {
  const response = await request(`/rest/v1/${table}?${query}`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "accept-profile": profile,
    },
  });
  return expectStatus(response, [200], `Select ${table}`);
}

async function ensureDemo(ownerToken, ownerId, members) {
  const workspaces = await select(ownerToken, "workspaces", "select=id,name&name=eq.QA%20Demo");
  let workspaceId = workspaces[0]?.id;

  if (!workspaceId) {
    workspaceId = await rpc(ownerToken, "create_workspace", {
      p_name: "QA Demo",
      p_description: "Automated QA workspace — safe to reset",
    });
    console.log("Created QA Demo workspace");
  }

  const boards = await select(
    ownerToken,
    "boards",
    `select=id&workspace_id=eq.${workspaceId}&key=eq.QA`,
  );
  let boardId = boards[0]?.id;

  if (!boardId) {
    boardId = await rpc(ownerToken, "create_board", {
      p_workspace_id: workspaceId,
      p_name: "QA Sprint Board",
      p_key: "QA",
      p_visibility: "workspace",
    });
    console.log("Created QA Sprint Board");
  }

  const columns = await select(ownerToken, "columns", `select=id,name&board_id=eq.${boardId}`);
  const todoColumn = columns.find((column) => column.name === "To do") ?? columns[0];

  const cards = await select(
    ownerToken,
    "cards",
    `select=id&board_id=eq.${boardId}&limit=1`,
  );

  if (!cards.length && todoColumn) {
    for (const title of [
      "Review dashboard polish",
      "Verify assignee notifications",
      "Load-test board queries",
    ]) {
      await rpc(ownerToken, "create_card", {
        p_board_id: boardId,
        p_column_id: todoColumn.id,
        p_title: title,
      });
    }
    console.log("Seeded demo cards");
  }

  for (const member of members) {
    if (!member.userId || member.userId === ownerId) continue;
    const memberResponse = await request("/rest/v1/rpc/seed_qa_workspace_member", {
      method: "POST",
      headers: {
        ...authHeaders(serviceRoleKey, "orbit"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        p_workspace_id: workspaceId,
        p_user_id: member.userId,
        p_role: member.workspaceRole,
      }),
    });
    await expectStatus(memberResponse, [200, 204], `Add member ${member.userId}`);
  }

  return { workspaceId, boardId };
}

try {
  const userIds = {};
  for (const spec of TEST_USERS) {
    userIds[spec.email] = await ensureUser(spec);
  }

  const ownerToken = await signIn(TEST_USERS[0].email);
  const demo = await ensureDemo(
    ownerToken,
    userIds[TEST_USERS[0].email],
    TEST_USERS.slice(1).map((spec) => ({
      userId: userIds[spec.email],
      workspaceRole: spec.workspaceRole ?? "member",
    })),
  );

  const users = TEST_USERS.map((spec) => ({
    email: spec.email,
    userId: userIds[spec.email],
    orbitRole: spec.role,
    workspaceRole: spec.workspaceRole ?? null,
    password: testPassword,
  }));

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), password: testPassword, demo, users },
      null,
      2,
    ),
  );

  console.log(`\nWrote ${users.length} users to supabase/.temp/orbit-test-users.json`);
} catch (error) {
  console.error("Seed failed:", error.message ?? error);
  process.exit(1);
}
