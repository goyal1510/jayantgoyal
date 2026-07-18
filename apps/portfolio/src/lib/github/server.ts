import { computeLOCStats } from "./compute";
import type { GitHubLOCStats, GitHubRepo, GitHubUser } from "./types";

type CacheEntry<T> = { data: T; timestamp: number };

const CACHE_TTL = 5 * 60 * 1000;
const BATCH_SIZE = 10;
const userCache = new Map<string, CacheEntry<GitHubUser>>();
const repositoryCache = new Map<string, CacheEntry<GitHubRepo[]>>();
const languageCache = new Map<string, CacheEntry<Record<string, number>>>();

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  data: T,
) {
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

async function fetchGitHubUser(username: string) {
  const key = username.toLowerCase();
  const cached = readCache(userCache, key);
  if (cached) return cached;

  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}`,
    { headers: getHeaders() },
  );
  if (!response.ok)
    throw new Error(`GitHub user request failed: ${response.status}`);

  return writeCache(userCache, key, (await response.json()) as GitHubUser);
}

async function fetchGitHubRepositories(username: string) {
  const key = username.toLowerCase();
  const cached = readCache(repositoryCache, key);
  if (cached) return cached;

  const repositories: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated`,
      { headers: getHeaders() },
    );
    if (!response.ok) {
      throw new Error(`GitHub repositories request failed: ${response.status}`);
    }

    const batch = (await response.json()) as GitHubRepo[];
    repositories.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return writeCache(repositoryCache, key, repositories);
}

async function fetchRepositoryLanguages(owner: string, repository: string) {
  const key = `${owner.toLowerCase()}/${repository.toLowerCase()}`;
  const cached = readCache(languageCache, key);
  if (cached) return cached;

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/languages`,
    { headers: getHeaders() },
  );
  if (!response.ok) return {};

  return writeCache(
    languageCache,
    key,
    (await response.json()) as Record<string, number>,
  );
}

export async function getGitHubCodeStats(
  username: string,
): Promise<GitHubLOCStats | null> {
  try {
    const [user, repositories] = await Promise.all([
      fetchGitHubUser(username),
      fetchGitHubRepositories(username),
    ]);
    const activeRepositories = repositories.filter(
      (repository) => !repository.fork && !repository.archived,
    );
    const languagesByRepository: Record<string, number>[] = [];

    for (
      let index = 0;
      index < activeRepositories.length;
      index += BATCH_SIZE
    ) {
      const batch = activeRepositories.slice(index, index + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((repository) =>
          fetchRepositoryLanguages(username, repository.name),
        ),
      );
      for (const result of results) {
        if (result.status === "fulfilled") {
          languagesByRepository.push(result.value);
        }
      }
    }

    return computeLOCStats(
      languagesByRepository,
      activeRepositories.length,
      user.created_at,
    );
  } catch (error) {
    console.error(
      "Unable to load GitHub code statistics",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}
