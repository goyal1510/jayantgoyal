import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  createDatabaseBoundaryHttp,
  databaseAuthHeaders as authHeaders,
} from "./lib/database-boundary-http.mjs";
import { createDatabaseBoundaryRest } from "./lib/database-boundary-rest.mjs";

const supabaseUrl =
  process.env.DATABASE_TEST_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.DATABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey =
  process.env.DATABASE_TEST_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error(
    "Database boundary tests require the Supabase URL, anon key, and service-role key.",
  );
}

const normalizedUrl = supabaseUrl.replace(/\/+$/, "");
const { expectStatus, readJson, request } =
  createDatabaseBoundaryHttp(normalizedUrl);
const testId = randomUUID();
const testEmail = `database-boundary-${testId}@example.invalid`;
const testPassword = `${randomBytes(24).toString("base64url")}Aa1!`;
const sessionId = randomUUID();
const participantId = randomUUID();
const roomCode = randomBytes(5).toString("hex").toUpperCase();
const rateLimitHash = createHash("sha256")
  .update(`database-boundary-${testId}`)
  .digest("hex");
const otherStorageName = `00000000-0000-0000-0000-000000000001/database-boundary-${testId}.txt`;

let userId = null;
let accessToken = null;
let ownStorageName = null;
let sessionCreated = false;
let ownStorageCreated = false;
let rateLimitCreated = false;
const { callUserRpc, restInsert, restSelect } = createDatabaseBoundaryRest({
  anonKey,
  serviceRoleKey,
  authHeaders,
  expectStatus,
  getAccessToken: () => accessToken,
  request,
});

async function callGameAction(overrides = {}) {
  const payload = {
    p_actor_user_id: userId,
    p_session_id: sessionId,
    p_participant_id: participantId,
    p_move_number: 1,
    p_move_payload: { type: "database_boundary_test" },
    p_resulting_state: { turn: "committed" },
    p_next_turn_participant_id: null,
    p_winner_participant_id: null,
    p_session_status: "active",
    p_completed_at: null,
    p_result_outcome: null,
    p_result_winner_participant_id: null,
    p_result_summary: null,
    ...overrides,
  };

  return request("/rest/v1/rpc/record_game_action", {
    method: "POST",
    headers: {
      ...authHeaders(serviceRoleKey, "studio"),
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function cleanup() {
  const cleanupErrors = [];

  if (ownStorageCreated) {
    const response = await request(
      `/storage/v1/object/studio-files/${ownStorageName}`,
      {
        method: "DELETE",
        headers: authHeaders(serviceRoleKey),
      },
    );
    if (![200, 204, 404].includes(response.status)) {
      cleanupErrors.push(`storage object (${response.status})`);
    }
    await readJson(response);
  }

  if (rateLimitCreated) {
    const response = await request(
      `/rest/v1/contact_rate_limits?key_hash=eq.${rateLimitHash}`,
      {
        method: "DELETE",
        headers: authHeaders(serviceRoleKey, "portfolio"),
      },
    );
    if (![200, 204].includes(response.status)) {
      cleanupErrors.push(`rate-limit record (${response.status})`);
    }
    await readJson(response);
  }

  if (sessionCreated) {
    const response = await request(
      `/rest/v1/game_sessions?id=eq.${sessionId}`,
      {
        method: "DELETE",
        headers: authHeaders(serviceRoleKey, "studio"),
      },
    );
    if (![200, 204].includes(response.status)) {
      cleanupErrors.push(`game session (${response.status})`);
    }
    await readJson(response);
  }

  if (userId) {
    const response = await request(`/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: authHeaders(serviceRoleKey),
    });
    if (![200, 204, 404].includes(response.status)) {
      cleanupErrors.push(`test account (${response.status})`);
    }
    await readJson(response);
  }

  if (cleanupErrors.length) {
    throw new Error(
      `Database test cleanup failed: ${cleanupErrors.join(", ")}`,
    );
  }
}

try {
  const createUserResponse = await request("/auth/v1/admin/users", {
    method: "POST",
    headers: {
      ...authHeaders(serviceRoleKey),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { purpose: "database-boundary-test" },
    }),
  });
  const createdUser = await expectStatus(
    createUserResponse,
    [200],
    "Create test account",
  );
  userId = createdUser?.id ?? createdUser?.user?.id ?? null;
  if (!userId) throw new Error("The temporary test account has no user ID.");
  ownStorageName = `${userId}/database-boundary.txt`;

  const signInResponse = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: {
      apikey: anonKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const signIn = await expectStatus(
    signInResponse,
    [200],
    "Sign in test account",
  );
  accessToken = signIn?.access_token ?? null;
  if (!accessToken) throw new Error("The temporary test account has no token.");

  const initialStudioAccess = await callUserRpc("has_product_access", "iam", {
    p_product_key: "studio",
  });
  if (initialStudioAccess !== false) {
    throw new Error("A new identity received Studio access without a grant.");
  }

  const initialAdminAccess = await callUserRpc("has_capability", "iam", {
    p_capability_key: "admin.console.enter",
  });
  if (initialAdminAccess !== false) {
    throw new Error("A new identity received Admin access without a grant.");
  }

  const blockedStudioInsert = await request("/rest/v1/scratchpad_entries", {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "content-profile": "studio",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      content: "This row must not be inserted.",
      entry_type: "text",
    }),
  });
  await expectStatus(
    blockedStudioInsert,
    [401, 403],
    "Unassigned Studio insert",
  );

  await restInsert("product_memberships", "iam", {
    product_key: "studio",
    user_id: userId,
    status: "active",
  });
  await restInsert("product_role_assignments", "iam", {
    product_key: "studio",
    user_id: userId,
    role_key: "studio.member",
  });

  const grantedStudioCapability = await callUserRpc("has_capability", "iam", {
    p_capability_key: "studio.files.create",
  });
  if (grantedStudioCapability !== true) {
    throw new Error("Studio membership and role did not grant its capability.");
  }

  const blockedRateLimitRead = await request(
    "/rest/v1/contact_rate_limits?select=key_hash&limit=1",
    { headers: authHeaders(anonKey, "portfolio") },
  );
  await expectStatus(
    blockedRateLimitRead,
    [401, 403],
    "Anonymous rate-limit table read",
  );

  const allowedRateLimitCall = await request(
    "/rest/v1/rpc/consume_contact_rate_limit",
    {
      method: "POST",
      headers: {
        ...authHeaders(anonKey, "portfolio"),
        "content-type": "application/json",
      },
      body: JSON.stringify({ p_key_hash: rateLimitHash }),
    },
  );
  const firstRateLimitAttempt = await expectStatus(
    allowedRateLimitCall,
    [200],
    "Anonymous bounded rate-limit call",
  );
  rateLimitCreated = true;
  if (firstRateLimitAttempt !== true) {
    throw new Error("The first temporary rate-limit attempt was not allowed.");
  }

  const ownStorageResponse = await request(
    `/storage/v1/object/studio-files/${ownStorageName}`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${accessToken}`,
        "content-type": "text/plain",
        "x-upsert": "false",
      },
      body: "database boundary verification",
    },
  );
  await expectStatus(ownStorageResponse, [200], "Own-folder storage upload");
  ownStorageCreated = true;

  const blockedStorageResponse = await request(
    `/storage/v1/object/studio-files/${otherStorageName}`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${accessToken}`,
        "content-type": "text/plain",
        "x-upsert": "false",
      },
      body: "this upload must be blocked",
    },
  );
  await expectStatus(
    blockedStorageResponse,
    [400, 401, 403],
    "Cross-user storage upload",
  );

  await restInsert("game_sessions", "studio", {
    id: sessionId,
    room_code: roomCode,
    game_slug: "tic-tac-toe",
    status: "active",
    max_players: 2,
    created_by: userId,
    state: { turn: "initial" },
  });
  sessionCreated = true;

  await restInsert("game_session_participants", "studio", {
    id: participantId,
    session_id: sessionId,
    user_id: userId,
    display_name: "Database Boundary Test",
    seat: "P1",
    is_host: true,
  });

  const blockedGameCall = await request("/rest/v1/rpc/record_game_action", {
    method: "POST",
    headers: {
      ...authHeaders(anonKey, "studio"),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      p_actor_user_id: userId,
      p_session_id: sessionId,
      p_participant_id: participantId,
      p_move_number: 1,
      p_move_payload: { type: "blocked" },
      p_resulting_state: {},
      p_next_turn_participant_id: null,
      p_winner_participant_id: null,
      p_session_status: "active",
      p_completed_at: null,
    }),
  });
  await expectStatus(
    blockedGameCall,
    [401, 403, 404],
    "Anonymous game transaction call",
  );

  const firstAction = await callGameAction();
  await expectStatus(firstAction, [200], "First transactional game action");

  const staleAction = await callGameAction({
    p_resulting_state: { turn: "stale" },
  });
  const staleError = await expectStatus(
    staleAction,
    [400, 409, 500],
    "Stale game action",
  );
  if (staleError?.code !== "P0001") {
    throw new Error(
      `Unexpected stale-action error: ${JSON.stringify(staleError)}`,
    );
  }

  const invalidResult = await callGameAction({
    p_move_number: 2,
    p_resulting_state: { turn: "should_rollback" },
    p_session_status: "completed",
    p_completed_at: new Date().toISOString(),
    p_result_outcome: "invalid",
    p_result_summary: { outcome: "invalid" },
  });
  const invalidResultError = await expectStatus(
    invalidResult,
    [400, 409, 500],
    "Invalid game result",
  );
  if (invalidResultError?.code !== "23514") {
    throw new Error(
      `Unexpected invalid-result error: ${JSON.stringify(invalidResultError)}`,
    );
  }

  const movesAfterFailures = await restSelect(
    "game_session_moves",
    "studio",
    `session_id=eq.${sessionId}&select=move_number,resulting_state&order=move_number`,
  );
  if (
    !Array.isArray(movesAfterFailures) ||
    movesAfterFailures.length !== 1 ||
    movesAfterFailures[0]?.resulting_state?.turn !== "committed"
  ) {
    throw new Error("A failed game action left partial move state behind.");
  }

  const completedAt = new Date().toISOString();
  const completion = await callGameAction({
    p_move_number: 2,
    p_move_payload: { type: "winning_move" },
    p_resulting_state: { turn: "completed" },
    p_winner_participant_id: participantId,
    p_session_status: "completed",
    p_completed_at: completedAt,
    p_result_outcome: "win",
    p_result_winner_participant_id: participantId,
    p_result_summary: { outcome: "win" },
  });
  await expectStatus(completion, [200], "Completed transactional game action");

  const [moves, results, sessions] = await Promise.all([
    restSelect(
      "game_session_moves",
      "studio",
      `session_id=eq.${sessionId}&select=move_number&order=move_number`,
    ),
    restSelect(
      "game_session_results",
      "studio",
      `session_id=eq.${sessionId}&select=outcome,winner_participant_id`,
    ),
    restSelect(
      "game_sessions",
      "studio",
      `id=eq.${sessionId}&select=status,winner_participant_id,state`,
    ),
  ]);

  if (
    !Array.isArray(moves) ||
    moves.map((move) => move.move_number).join() !== "1,2"
  ) {
    throw new Error("The completed game did not retain ordered moves.");
  }
  if (
    !Array.isArray(results) ||
    results.length !== 1 ||
    results[0]?.outcome !== "win" ||
    results[0]?.winner_participant_id !== participantId
  ) {
    throw new Error("The completed game result is inconsistent.");
  }
  if (
    !Array.isArray(sessions) ||
    sessions.length !== 1 ||
    sessions[0]?.status !== "completed" ||
    sessions[0]?.winner_participant_id !== participantId ||
    sessions[0]?.state?.turn !== "completed"
  ) {
    throw new Error("The completed game session is inconsistent.");
  }

  console.log(
    "Database boundaries verified: default denial, role grants, contact throttling, owner-scoped storage, stale-action rejection, and atomic game completion.",
  );
} finally {
  await cleanup();
}
