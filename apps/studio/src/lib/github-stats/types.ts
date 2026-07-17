export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  location: string | null
  company: string | null
  blog: string | null
  twitter_username: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  fork: boolean
  archived: boolean
  created_at: string
  updated_at: string
  pushed_at: string
  topics: string[]
  size: number
}

export interface GitHubStats {
  totalStars: number
  totalForks: number
  totalRepos: number
  mostUsedLanguage: string | null
  avgStarsPerRepo: number
  accountAgeDays: number
}

export interface LanguageDistribution {
  name: string
  value: number
  color: string
}

export interface LanguageLOCBreakdown {
  name: string
  lines: number
  percentage: number
  color: string
}

export interface GitHubLOCStats {
  totalLinesOfCode: number
  totalRepos: number
  totalLanguages: number
  topLanguage: string | null
  yearsOfCoding: number
  languageBreakdown: LanguageLOCBreakdown[]
}
