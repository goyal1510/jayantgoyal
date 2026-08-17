/** Create schema-explicit PostgREST helpers for the linked boundary test. */
export function createDatabaseBoundaryRest({
  anonKey,
  serviceRoleKey,
  authHeaders,
  expectStatus,
  getAccessToken,
  request,
}) {
  async function restInsert(table, profile, body) {
    const response = await request(`/rest/v1/${table}`, {
      method: "POST",
      headers: {
        ...authHeaders(serviceRoleKey, profile),
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    return expectStatus(response, [201], `Insert into ${profile}.${table}`);
  }

  async function restSelect(table, profile, query) {
    const response = await request(`/rest/v1/${table}?${query}`, {
      headers: authHeaders(serviceRoleKey, profile),
    });
    return expectStatus(response, [200], `Select from ${profile}.${table}`);
  }

  async function callUserRpc(name, profile, body) {
    const response = await request(`/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${getAccessToken()}`,
        "content-type": "application/json",
        "accept-profile": profile,
        "content-profile": profile,
      },
      body: JSON.stringify(body),
    });
    return expectStatus(response, [200], `Call ${profile}.${name}`);
  }

  return { callUserRpc, restInsert, restSelect };
}
