const schema = "career";

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function createCareerClient() {
  const baseUrl = requireEnvironment("NEXT_PUBLIC_SUPABASE_URL").replace(
    /\/$/,
    "",
  );
  const serviceRoleKey = requireEnvironment("SUPABASE_SERVICE_ROLE_KEY");

  async function request(path, { method = "GET", body, query = "" } = {}) {
    const response = await fetch(`${baseUrl}/rest/v1/${path}${query}`, {
      method,
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        "accept-profile": schema,
        "content-profile": schema,
        "content-type": "application/json",
        prefer: "return=representation,resolution=merge-duplicates",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(
        payload?.message ??
          payload?.error ??
          `Supabase request failed (${response.status})`,
      );
    }
    return payload;
  }

  return { request };
}

export async function upsertOne(client, table, row, conflictColumn) {
  const result = await client.request(table, {
    method: "POST",
    query: `?on_conflict=${encodeURIComponent(conflictColumn)}`,
    body: row,
  });
  if (!Array.isArray(result) || !result[0]) {
    throw new Error(`No ${table} row returned after upsert.`);
  }
  return result[0];
}
