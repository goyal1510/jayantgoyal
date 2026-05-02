/**
 * Server-side GitHub API functions — call api.github.com directly with GITHUB_TOKEN.
 * Used by API routes and server components. The client-side api.ts uses the /api/github-stats proxy instead.
 */
import type { GitHubUser, GitHubRepo } from "./types"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const userCache = new Map<string, CacheEntry<GitHubUser>>()
const reposCache = new Map<string, CacheEntry<GitHubRepo[]>>()
const languagesCache = new Map<string, CacheEntry<Record<string, number>>>()

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

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: "application/vnd.github.v3+json" }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const key = username.toLowerCase()
  const cached = getCached(userCache, key)
  if (cached) return cached

  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers: getHeaders(),
  })
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
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}&sort=updated`,
      { headers: getHeaders() }
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

export async function fetchRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`
  const cached = getCached(languagesCache, key)
  if (cached) return cached

  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
    { headers: getHeaders() }
  )
  if (!res.ok) return {}

  const data: Record<string, number> = await res.json()
  setCache(languagesCache, key, data)
  return data
}
