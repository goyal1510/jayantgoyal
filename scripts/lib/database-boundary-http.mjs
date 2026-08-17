export function databaseAuthHeaders(key, profile) {
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    ...(profile
      ? {
          "accept-profile": profile,
          "content-profile": profile,
        }
      : {}),
  };
}

/** Create bounded HTTP helpers for destructive linked database verification. */
export function createDatabaseBoundaryHttp(baseUrl) {
  async function request(path, options = {}) {
    try {
      return await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: options.signal ?? AbortSignal.timeout(15_000),
      });
    } catch (error) {
      throw new Error(
        `${options.method ?? "GET"} ${path} failed before receiving a response.`,
        { cause: error },
      );
    }
  }

  async function readJson(response) {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function expectStatus(response, allowedStatuses, label) {
    const body = await readJson(response);
    if (!allowedStatuses.includes(response.status)) {
      throw new Error(
        `${label} returned ${response.status}: ${JSON.stringify(body)}`,
      );
    }

    return body;
  }

  return { expectStatus, readJson, request };
}
