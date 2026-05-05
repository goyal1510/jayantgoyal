import { loadEnv } from "./env.mjs";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = loadEnv();
const SCHEMA = "jg_app";

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Profile": SCHEMA,
    "Accept-Profile": SCHEMA,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function handle(res, label) {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${label} failed (${res.status}): ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function select(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;
  const res = await fetch(url, { headers: headers() });
  return handle(res, `select ${table}`);
}

export async function insert(table, rows) {
  if (!Array.isArray(rows)) rows = [rows];
  if (rows.length === 0) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(rows),
  });
  return handle(res, `insert ${table}`);
}

export async function upsert(table, rows, { onConflict } = {}) {
  if (!Array.isArray(rows)) rows = [rows];
  if (rows.length === 0) return [];
  const qs = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${qs}`, {
    method: "POST",
    headers: headers({
      Prefer: "return=representation,resolution=merge-duplicates",
    }),
    body: JSON.stringify(rows),
  });
  return handle(res, `upsert ${table}`);
}

export async function update(table, query, patch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  return handle(res, `update ${table}`);
}
