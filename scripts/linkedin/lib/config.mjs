import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const LINKEDIN_DIRECTORY = path.dirname(
  path.dirname(fileURLToPath(import.meta.url)),
);

const LOCAL_ENV_FILE = path.join(LINKEDIN_DIRECTORY, ".env");
const ADMIN_ENV_FILE = path.resolve(
  LINKEDIN_DIRECTORY,
  "../../apps/admin/web/.env.local",
);

/** Load the optional ignored LinkedIn environment file without overriding shell values. */
export function loadLocalEnvironment() {
  if (fs.existsSync(LOCAL_ENV_FILE)) process.loadEnvFile(LOCAL_ENV_FILE);
  if (fs.existsSync(ADMIN_ENV_FILE)) process.loadEnvFile(ADMIN_ENV_FILE);
}

/** Resolve the public Supabase connection used with a normal authenticated session. */
export function getSupabaseConfig() {
  loadLocalEnvironment();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Run with --env-file=apps/admin/web/.env.local or configure scripts/linkedin/.env.",
    );
  }
  return { url, anonKey };
}
