import type { GitHubUser, GitHubRepo } from "./types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const userCache = new Map<string, CacheEntry<GitHubUser>>();
const reposCache = new Map<string, CacheEntry<GitHubRepo[]>>();
const languagesCache = new Map<string, CacheEntry<Record<string, number>>>();

function getCached<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function githubFetch(path: string, params?: Record<string, string>) {
  const searchParams = new URLSearchParams({ path, ...params });
  const res = await fetch(`/api/github-stats?${searchParams.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 404) throw new Error(`User not found`);
    if (res.status === 403)
      throw new Error("GitHub API rate limit exceeded. Try again later.");
    throw new Error(data.message || `GitHub API error: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const key = username.toLowerCase();
  const cached = getCached(userCache, key);
  if (cached) return cached;

  const data: GitHubUser = await githubFetch(
    `/users/${encodeURIComponent(username)}`,
  );
  setCache(userCache, key, data);
  return data;
}

export async function fetchGitHubRepos(
  username: string,
): Promise<GitHubRepo[]> {
  const key = username.toLowerCase();
  const cached = getCached(reposCache, key);
  if (cached) return cached;

  const allRepos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const repos: GitHubRepo[] = await githubFetch(
      `/users/${encodeURIComponent(username)}/repos`,
      { per_page: String(perPage), page: String(page), sort: "updated" },
    );
    allRepos.push(...repos);

    if (repos.length < perPage) break;
    page++;
  }

  setCache(reposCache, key, allRepos);
  return allRepos;
}

export async function fetchRepoLanguages(
  owner: string,
  repo: string,
): Promise<Record<string, number>> {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cached = getCached(languagesCache, key);
  if (cached) return cached;

  try {
    const data: Record<string, number> = await githubFetch(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
    );
    setCache(languagesCache, key, data);
    return data;
  } catch {
    return {};
  }
}
