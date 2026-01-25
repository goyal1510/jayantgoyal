export interface Activity {
  id: string
  name: string
  user_id: string | null
  is_active: boolean
  created_at: string | null
}

export interface ActivityEntry {
  id: string
  activity_id: string | null
  date: string // YYYY-MM-DD format
  completed: boolean
  user_id: string | null
  created_at: string | null
}

export interface ActivityWithEntries extends Activity {
  entries: ActivityEntry[]
}

export interface ActivityStats {
  activity_id: string
  activity_name: string
  total_days: number
  completed_days: number
  completion_rate: number
}
