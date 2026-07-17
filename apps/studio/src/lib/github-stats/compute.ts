import type { GitHubRepo, GitHubStats, GitHubLOCStats, LanguageDistribution, LanguageLOCBreakdown } from "./types"

// GitHub-style language colors
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Scala: "#c22d40",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  R: "#198CE7",
  Julia: "#a270ba",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Clojure: "#db5855",
  Perl: "#0298c3",
  Objective_C: "#438eff",
  Zig: "#ec915c",
  Nim: "#ffc200",
  Dockerfile: "#384d54",
  Makefile: "#427819",
}

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? "#8b8b8b"
}

const BYTES_PER_LINE = 40

export function bytesToLines(bytes: number): number {
  return Math.round(bytes / BYTES_PER_LINE)
}

export function computeLOCStats(
  languagesByRepo: Record<string, number>[],
  totalRepos: number,
  createdAt: string
): GitHubLOCStats {
  const aggregated = new Map<string, number>()

  for (const repoLangs of languagesByRepo) {
    for (const [lang, bytes] of Object.entries(repoLangs)) {
      aggregated.set(lang, (aggregated.get(lang) ?? 0) + bytes)
    }
  }

  let totalBytes = 0
  let topLanguage: string | null = null
  let topBytes = 0

  for (const [lang, bytes] of aggregated) {
    totalBytes += bytes
    if (bytes > topBytes) {
      topBytes = bytes
      topLanguage = lang
    }
  }

  const totalLinesOfCode = bytesToLines(totalBytes)

  const languageBreakdown: LanguageLOCBreakdown[] = Array.from(aggregated.entries())
    .map(([name, bytes]) => ({
      name,
      lines: bytesToLines(bytes),
      percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
      color: getLanguageColor(name),
    }))
    .sort((a, b) => b.lines - a.lines)

  const yearsOfCoding = Math.max(
    1,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
  )

  return {
    totalLinesOfCode,
    totalRepos,
    totalLanguages: aggregated.size,
    topLanguage,
    yearsOfCoding,
    languageBreakdown,
  }
}

export function computeStats(repos: GitHubRepo[], createdAt: string): GitHubStats {
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0)
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0)
  const totalRepos = repos.length

  // Find most used language
  const langCounts = new Map<string, number>()
  for (const repo of repos) {
    if (repo.language) {
      langCounts.set(repo.language, (langCounts.get(repo.language) ?? 0) + 1)
    }
  }
  let mostUsedLanguage: string | null = null
  let maxCount = 0
  for (const [lang, count] of langCounts) {
    if (count > maxCount) {
      maxCount = count
      mostUsedLanguage = lang
    }
  }

  const avgStarsPerRepo = totalRepos > 0 ? Math.round((totalStars / totalRepos) * 10) / 10 : 0
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  return { totalStars, totalForks, totalRepos, mostUsedLanguage, avgStarsPerRepo, accountAgeDays }
}

export function computeLanguageDistribution(repos: GitHubRepo[]): LanguageDistribution[] {
  const langCounts = new Map<string, number>()
  for (const repo of repos) {
    if (repo.language) {
      langCounts.set(repo.language, (langCounts.get(repo.language) ?? 0) + 1)
    }
  }

  return Array.from(langCounts.entries())
    .map(([name, value]) => ({ name, value, color: getLanguageColor(name) }))
    .sort((a, b) => b.value - a.value)
}

export function getTopReposByStars(repos: GitHubRepo[], limit = 10): GitHubRepo[] {
  return [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, limit)
}
