import fs from "node:fs";
import path from "node:path";

import { getSupabaseConfig, LINKEDIN_DIRECTORY } from "./config.mjs";

const DATABASE_TOKEN_FILE = path.join(
  LINKEDIN_DIRECTORY,
  ".supabase-token.json",
);

async function authRequest(pathname, body, fetchImplementation = fetch) {
  const { url, anonKey } = getSupabaseConfig();
  const response = await fetchImplementation(`${url}/auth/v1/${pathname}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.msg ?? payload.message ?? payload.error_description;
    throw new Error(
      `Supabase authentication failed (${response.status})${message ? `: ${message}` : "."}`,
    );
  }
  return payload;
}

function normalizedSession(payload) {
  if (!payload.access_token || !payload.refresh_token) {
    throw new Error("Supabase did not return a complete session.");
  }
  const expiresAt = payload.expires_at
    ? new Date(payload.expires_at * 1000)
    : new Date(Date.now() + Number(payload.expires_in ?? 3600) * 1000);
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: expiresAt.toISOString(),
    user_id: payload.user?.id ?? null,
    email: payload.user?.email ?? null,
  };
}

function saveDatabaseSession(session) {
  fs.writeFileSync(
    DATABASE_TOKEN_FILE,
    `${JSON.stringify(session, null, 2)}\n`,
    {
      mode: 0o600,
    },
  );
}

/** Authenticate the operator without placing their password in arguments or files. */
export async function signInToSupabase(
  email,
  password,
  fetchImplementation = fetch,
) {
  const payload = await authRequest(
    "token?grant_type=password",
    { email, password },
    fetchImplementation,
  );
  const session = normalizedSession(payload);
  saveDatabaseSession(session);
  return { email: session.email, userId: session.user_id };
}

/** Return a current user access token, refreshing the ignored local session when needed. */
export async function getDatabaseAccessToken(fetchImplementation = fetch) {
  if (!fs.existsSync(DATABASE_TOKEN_FILE)) {
    throw new Error(
      "No Supabase session found. Run: node scripts/linkedin/database-auth.mjs",
    );
  }
  const session = JSON.parse(fs.readFileSync(DATABASE_TOKEN_FILE, "utf8"));
  if (new Date(session.expires_at).getTime() > Date.now() + 60_000) {
    return session.access_token;
  }
  const payload = await authRequest(
    "token?grant_type=refresh_token",
    { refresh_token: session.refresh_token },
    fetchImplementation,
  );
  const refreshed = normalizedSession(payload);
  saveDatabaseSession(refreshed);
  return refreshed.access_token;
}
