export interface Database {
  scratchpad: {
    Tables: {
      entries: {
        Row: {
          id: string
          user_id: string
          content: string
          entry_type: "text" | "code"
          language: string | null
          created_at: string
          updated_at: string
          is_read: boolean
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          entry_type: "text" | "code"
          language?: string | null
          created_at?: string
          updated_at?: string
          is_read?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          entry_type?: "text" | "code"
          language?: string | null
          created_at?: string
          updated_at?: string
          is_read?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
