import { computeLOCStats, filterActiveRepositories } from "./compute";
import type {
  GitHubClient,
  GitHubClientOptions,
  GitHubRequest,
  GitHubRequestParams,
  GitHubRepo,
  GitHubUser,
} from "./types";

const DEFAULT_BASE_URL = "https://api.github.com";
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;
const DEFAULT_LANGUAGE_BATCH_SIZE = 10;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly ttlMs: number,
    private readonly now: () => number,
  ) {}

  get<T>(key: string): T | null {
    const entry = this.entries.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T): T {
    this.entries.set(key, { data, expiresAt: this.now() + this.ttlMs });
    return data;
  }
}

export class GitHubApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly code: "not_found" | "rate_limited" | "api_error";

  constructor(status: number, path: string, message: string) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.path = path;
    this.code = status === 404 ? "not_found" : status === 403 ? "rate_limited" : "api_error";
  }
}

function toParams(params?: GitHubRequestParams): string {
  return params ? new URLSearchParams(params).toString() : "";
}

function normaliseKey(value: string): string {
  return value.trim().toLowerCase();
}

async function readErrorMessage(response: Response): Promise<string | null> {
  const body = await response.json().catch(() => null) as { message?: unknown } | null;
  return typeof body?.message === "string" ? body.message : null;
}

export function createGitHubClient(options: GitHubClientOptions = {}): GitHubClient {
  const fetcher = options.fetcher ?? fetch;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const now = options.now ?? Date.now;
  const cache = new MemoryCache(options.cacheTtlMs ?? DEFAULT_CACHE_TTL, now);
  const languageBatchSize = options.languageBatchSize ?? DEFAULT_LANGUAGE_BATCH_SIZE;

  const request: GitHubRequest = options.request ?? (async (path, params, init) => {
    const query = toParams(params);
    const url = `${baseUrl.replace(/\/$/, "")}${path}${query ? `?${query}` : ""}`;
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/vnd.github.v3+json");
    if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
    return fetcher(url, { ...init, headers });
  });

  async function fetchJson<T>(path: string, params?: GitHubRequestParams): Promise<T> {
    const response = await request(path, params);
    if (!response.ok) {
      const message =
        (await readErrorMessage(response)) ??
        (response.status === 403
          ? "GitHub API rate limit exceeded. Try again later."
          : `GitHub API request failed: ${response.statusText}`);
      throw new GitHubApiError(response.status, path, message);
    }
    return (await response.json()) as T;
  }

  async function fetchUser(username: string): Promise<GitHubUser> {
    const key = normaliseKey(username);
    const cached = cache.get<GitHubUser>(`user:${key}`);
    if (cached) return cached;
    return cache.set(`user:${key}`, await fetchJson<GitHubUser>(`/users/${encodeURIComponent(username.trim())}`));
  }

  async function fetchRepositories(username: string): Promise<GitHubRepo[]> {
    const key = normaliseKey(username);
    const cached = cache.get<GitHubRepo[]>(`repositories:${key}`);
    if (cached) return cached;

    const repositories: GitHubRepo[] = [];
    let page = 1;
    while (true) {
      const batch = await fetchJson<GitHubRepo[]>(
        `/users/${encodeURIComponent(username.trim())}/repos`,
        { per_page: "100", page: String(page), sort: "updated" },
      );
      repositories.push(...batch);
      if (batch.length < 100) break;
      page += 1;
    }

    return cache.set(`repositories:${key}`, repositories);
  }

  async function fetchRepositoryLanguages(owner: string, repository: string): Promise<Record<string, number>> {
    const key = `languages:${normaliseKey(owner)}/${normaliseKey(repository)}`;
    const cached = cache.get<Record<string, number>>(key);
    if (cached) return cached;
    return cache.set(
      key,
      await fetchJson<Record<string, number>>(
        `/repos/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repository.trim())}/languages`,
      ),
    );
  }

  async function getCodeStats(username: string) {
    const [user, repositories] = await Promise.all([
      fetchUser(username),
      fetchRepositories(username),
    ]);
    const activeRepositories = filterActiveRepositories(repositories);
    const languagesByRepository: Record<string, number>[] = [];

    for (let index = 0; index < activeRepositories.length; index += languageBatchSize) {
      const batch = activeRepositories.slice(index, index + languageBatchSize);
      const results = await Promise.allSettled(
        batch.map((repository) => fetchRepositoryLanguages(username, repository.name)),
      );
      for (const result of results) {
        if (result.status === "fulfilled") languagesByRepository.push(result.value);
      }
    }

    return computeLOCStats(languagesByRepository, activeRepositories.length, user.created_at, now());
  }

  return {
    request,
    fetchUser,
    fetchRepositories,
    fetchRepositoryLanguages,
    getCodeStats,
  };
}
