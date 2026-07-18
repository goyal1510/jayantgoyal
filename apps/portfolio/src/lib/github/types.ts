export interface GitHubUser {
  created_at: string;
}

export interface GitHubRepo {
  name: string;
  fork: boolean;
  archived: boolean;
}

export interface LanguageLOCBreakdown {
  name: string;
  lines: number;
  percentage: number;
  color: string;
}

export interface GitHubLOCStats {
  totalLinesOfCode: number;
  totalRepos: number;
  totalLanguages: number;
  topLanguage: string | null;
  yearsOfCoding: number;
  languageBreakdown: LanguageLOCBreakdown[];
}
