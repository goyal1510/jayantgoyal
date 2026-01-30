import type { GitHubUser, GitHubRepo } from "./types"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const userCache = new Map<string, CacheEntry<GitHubUser>>()
const reposCache = new Map<string, CacheEntry<GitHubRepo[]>>()

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() })
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const key = username.toLowerCase()
  const cached = getCached(userCache, key)
  if (cached) return cached

  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error(`User "${username}" not found`)
    if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Try again later.")
    throw new Error(`Failed to fetch user: ${res.statusText}`)
  }

  const data: GitHubUser = await res.json()
  setCache(userCache, key, data)
  return data
}

export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const key = username.toLowerCase()
  const cached = getCached(reposCache, key)
  if (cached) return cached

  const allRepos: GitHubRepo[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}&sort=updated`
    )
    if (!res.ok) {
      if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Try again later.")
      throw new Error(`Failed to fetch repos: ${res.statusText}`)
    }

    const repos: GitHubRepo[] = await res.json()
    allRepos.push(...repos)

    if (repos.length < perPage) break
    page++
  }

  setCache(reposCache, key, allRepos)
  return allRepos
}
