export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  messenger: {
    Tables: {
      messages: {
        Row: {
          id: string
          user_id: string
          conversation_id: string | null
          sender_id: string | null
          reply_to_message_id: string | null
          content: string
          message_type: "text" | "code"
          language: string | null
          metadata: Json
          created_at: string
          updated_at: string
          edited_at: string | null
          deleted_at: string | null
          is_read: boolean
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id?: string | null
          sender_id?: string | null
          reply_to_message_id?: string | null
          content: string
          message_type: "text" | "code"
          language?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          edited_at?: string | null
          deleted_at?: string | null
          is_read?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string | null
          sender_id?: string | null
          reply_to_message_id?: string | null
          content?: string
          message_type?: "text" | "code"
          language?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          edited_at?: string | null
          deleted_at?: string | null
          is_read?: boolean
        }
      }
      conversations: {
        Row: {
          id: string
          conversation_type: "direct" | "group" | "self" | "support"
          title: string | null
          created_by: string
          metadata: Json
          is_archived: boolean
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_type?: "direct" | "group" | "self" | "support"
          title?: string | null
          created_by: string
          metadata?: Json
          is_archived?: boolean
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_type?: "direct" | "group" | "self" | "support"
          title?: string | null
          created_by?: string
          metadata?: Json
          is_archived?: boolean
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: "owner" | "member" | "support_agent"
          display_name: string | null
          last_read_at: string | null
          muted_until: string | null
          joined_at: string
          left_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          role?: "owner" | "member" | "support_agent"
          display_name?: string | null
          last_read_at?: string | null
          muted_until?: string | null
          joined_at?: string
          left_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: "owner" | "member" | "support_agent"
          display_name?: string | null
          last_read_at?: string | null
          muted_until?: string | null
          joined_at?: string
          left_at?: string | null
          created_at?: string
          updated_at?: string
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
