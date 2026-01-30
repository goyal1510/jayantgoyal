import type { GitHubRepo, GitHubStats, LanguageDistribution } from "./types"

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

function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? "#8b8b8b"
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
