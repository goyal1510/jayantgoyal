export function databaseAuthHeaders(key: string, profile?: string) {
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

export function createDatabaseBoundaryHttp(baseUrl: string) {
  async function request(path: string, options: RequestInit = {}) {
    return fetch(`${baseUrl}${path}`, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(15_000),
    });
  }

  async function readJson(response: Response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  async function expectStatus(response: Response, allowedStatuses: number[], label: string) {
    const body = await readJson(response);
    if (!allowedStatuses.includes(response.status)) {
      throw new Error(`${label} returned ${response.status}: ${JSON.stringify(body)}`);
    }
    return body;
  }

  return { expectStatus, readJson, request };
}
