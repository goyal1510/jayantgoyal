export interface TypingTestResult {
  id: string
  user_id: string | null
  wpm: number
  accuracy: number
  duration_seconds: number
  total_characters: number
  correct_characters: number
  text_length: number
  created_at: string | null
}

export interface NewTypingTestResult {
  wpm: number
  accuracy: number
  duration_seconds: number
  total_characters: number
  correct_characters: number
  text_length: number
}

export interface PaginatedTypingResults {
  items: TypingTestResult[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
