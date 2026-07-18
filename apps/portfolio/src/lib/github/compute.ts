import type { GitHubLOCStats, LanguageLOCBreakdown } from "./types";

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
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Dockerfile: "#384d54",
};

const BYTES_PER_LINE = 40;

function bytesToLines(bytes: number) {
  return Math.round(bytes / BYTES_PER_LINE);
}

export function computeLOCStats(
  languagesByRepo: Record<string, number>[],
  totalRepos: number,
  createdAt: string,
): GitHubLOCStats {
  const aggregated = new Map<string, number>();

  for (const repositoryLanguages of languagesByRepo) {
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
      color: LANGUAGE_COLORS[name] ?? "#8b8b8b",
    }))
    .sort((first, second) => second.lines - first.lines);

  const yearsOfCoding = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(createdAt).getTime()) /
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
