import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const AUTH_TEST_KEYS = new Set([
  "AUTH_TEST_MAIN_BASE_URL",
  "AUTH_TEST_ADMIN_BASE_URL",
  "AUTH_TEST_AUTH_BASE_URL",
  "AUTH_TEST_SUPABASE_URL",
  "AUTH_TEST_SUPABASE_ANON_KEY",
  "AUTH_TEST_SUPABASE_SERVICE_ROLE_KEY",
  "AUTH_TEST_ALLOW_AUTHENTICATED",
  "AUTH_TEST_CROSS_HOST",
  "AUTH_TEST_USER_EMAIL",
  "AUTH_TEST_USER_PASSWORD",
  "AUTH_TEST_USER_TOTP_SECRET",
  "AUTH_TEST_NON_ADMIN_EMAIL",
  "AUTH_TEST_NON_ADMIN_PASSWORD",
  "AUTH_TEST_ADMIN_EMAIL",
  "AUTH_TEST_ADMIN_PASSWORD",
  "AUTH_TEST_ADMIN_TOTP_SECRET",
]);

function unquote(value: string) {
  const first = value.at(0);
  const last = value.at(-1);
  if (value.length >= 2 && first === last && (first === '"' || first === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

export function loadAuthTestEnvironment() {
  const envPath = path.resolve(
    process.cwd(),
    "apps/jayantgoyal/.env.test.local",
  );
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    if (!AUTH_TEST_KEYS.has(key) || process.env[key] !== undefined) continue;

    const value = unquote(line.slice(separator + 1).trim());
    if (value) process.env[key] = value;
  }
}

loadAuthTestEnvironment();

function normalizeBaseUrl(value: string) {
  const url = new URL(value);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

const explicitMainUrl = process.env.AUTH_TEST_MAIN_BASE_URL?.trim();
const explicitAdminUrl = process.env.AUTH_TEST_ADMIN_BASE_URL?.trim();
const explicitAuthUrl = process.env.AUTH_TEST_AUTH_BASE_URL?.trim();
const explicitSupabaseUrl = process.env.AUTH_TEST_SUPABASE_URL?.trim();
const explicitSupabaseAnonKey = process.env.AUTH_TEST_SUPABASE_ANON_KEY?.trim();
const explicitSupabaseServiceRoleKey =
  process.env.AUTH_TEST_SUPABASE_SERVICE_ROLE_KEY?.trim();

if (Boolean(explicitMainUrl) !== Boolean(explicitAdminUrl)) {
  throw new Error(
    "AUTH_TEST_MAIN_BASE_URL and AUTH_TEST_ADMIN_BASE_URL must be set together.",
  );
}

export const authTestEnvironment = {
  mainBaseUrl: normalizeBaseUrl(explicitMainUrl || "http://127.0.0.1:3000"),
  adminBaseUrl: normalizeBaseUrl(explicitAdminUrl || "http://127.0.0.1:3001"),
  authBaseUrl: normalizeBaseUrl(explicitAuthUrl || "http://127.0.0.1:3003"),
  external: Boolean(explicitMainUrl && explicitAdminUrl),
  supabaseBaseUrl: explicitSupabaseUrl || "http://127.0.0.1:54329",
  supabaseAnonKey: explicitSupabaseAnonKey || "local-auth-test-anon-key",
  supabaseServiceRoleKey:
    explicitSupabaseServiceRoleKey || "local-auth-test-service-key",
  fakeSupabase: !explicitSupabaseUrl && !explicitMainUrl && !explicitAdminUrl,
  authenticated: process.env.AUTH_TEST_ALLOW_AUTHENTICATED === "true",
  crossHost: process.env.AUTH_TEST_CROSS_HOST === "true",
};

export function appUrl(baseUrl: string, pathname: string) {
  return new URL(pathname, `${baseUrl}/`).toString();
}

export type AuthTestPersona = {
  email: string;
  password: string;
  totpSecret?: string;
};

export function getAuthTestPersona(
  kind: "USER" | "NON_ADMIN" | "ADMIN",
): AuthTestPersona | null {
  const email = process.env[`AUTH_TEST_${kind}_EMAIL`]?.trim();
  const password = process.env[`AUTH_TEST_${kind}_PASSWORD`];
  const totpSecret = process.env[`AUTH_TEST_${kind}_TOTP_SECRET`]?.trim();

  if (!email || !password) return null;
  return { email, password, ...(totpSecret ? { totpSecret } : {}) };
}
