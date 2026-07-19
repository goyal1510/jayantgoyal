import type {
  GitHubLOCStats,
  GitHubRepo,
  GitHubStats,
  LanguageDistribution,
  LanguageLOCBreakdown,
} from "./types";

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00add8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4f5d95",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  Dart: "#00b4ab",
  Scala: "#c22d40",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Lua: "#000080",
  R: "#198ce7",
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
};

const BYTES_PER_LINE = 40;

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? "#8b8b8b";
}

export function bytesToLines(bytes: number): number {
  return Math.round(bytes / BYTES_PER_LINE);
}

export function filterActiveRepositories(repositories: GitHubRepo[]): GitHubRepo[] {
  return repositories.filter((repository) => !repository.fork && !repository.archived);
}

export function computeLOCStats(
  languagesByRepository: Record<string, number>[],
  totalRepos: number,
  createdAt: string,
  now = Date.now(),
): GitHubLOCStats {
  const aggregated = new Map<string, number>();

  for (const repositoryLanguages of languagesByRepository) {
    for (const [language, bytes] of Object.entries(repositoryLanguages)) {
      aggregated.set(language, (aggregated.get(language) ?? 0) + bytes);
    }
  }

  const totalBytes = Array.from(aggregated.values()).reduce(
    (sum, bytes) => sum + bytes,
    0,
  );
  const languageBreakdown: LanguageLOCBreakdown[] = Array.from(
    aggregated.entries(),
  )
    .map(([name, bytes]) => ({
      name,
      lines: bytesToLines(bytes),
      percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
      color: getLanguageColor(name),
    }))
    .sort((first, second) => second.lines - first.lines);

  const yearsOfCoding = Math.max(
    1,
    Math.floor(
      (now - new Date(createdAt).getTime()) /
        (1000 * 60 * 60 * 24 * 365),
    ),
  );

  return {
    totalLinesOfCode: bytesToLines(totalBytes),
    totalRepos,
    totalLanguages: aggregated.size,
    topLanguage: languageBreakdown[0]?.name ?? null,
    yearsOfCoding,
    languageBreakdown,
  };
}

export function computeStats(repositories: GitHubRepo[], createdAt: string, now = Date.now()): GitHubStats {
  const totalStars = repositories.reduce((sum, repository) => sum + repository.stargazers_count, 0);
  const totalForks = repositories.reduce((sum, repository) => sum + repository.forks_count, 0);
  const languageCounts = new Map<string, number>();

  for (const repository of repositories) {
    if (repository.language) {
      languageCounts.set(
        repository.language,
        (languageCounts.get(repository.language) ?? 0) + 1,
      );
    }
  }

  const mostUsedLanguage = [...languageCounts.entries()].sort(
    (first, second) => second[1] - first[1],
  )[0]?.[0] ?? null;
  const totalRepos = repositories.length;

  return {
    totalStars,
    totalForks,
    totalRepos,
    mostUsedLanguage,
    avgStarsPerRepo:
      totalRepos > 0 ? Math.round((totalStars / totalRepos) * 10) / 10 : 0,
    accountAgeDays: Math.floor(
      (now - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  };
}

export function computeLanguageDistribution(
  repositories: GitHubRepo[],
): LanguageDistribution[] {
  const languageCounts = new Map<string, number>();

  for (const repository of repositories) {
    if (repository.language) {
      languageCounts.set(
        repository.language,
        (languageCounts.get(repository.language) ?? 0) + 1,
      );
    }
  }

  return [...languageCounts.entries()]
    .map(([name, value]) => ({ name, value, color: getLanguageColor(name) }))
    .sort((first, second) => second.value - first.value);
}

export function getTopReposByStars(repositories: GitHubRepo[], limit = 10): GitHubRepo[] {
  return [...repositories]
    .sort((first, second) => second.stargazers_count - first.stargazers_count)
    .slice(0, limit);
}
