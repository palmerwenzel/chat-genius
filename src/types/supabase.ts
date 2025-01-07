export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      channels: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          type: 'text' | 'voice'
          is_public: boolean
          owner_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          type?: 'text' | 'voice'
          is_public?: boolean
          owner_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          type?: 'text' | 'voice'
          is_public?: boolean
          owner_id?: string
        }
      }
      channel_members: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          user_id: string
          content: string
          type: 'text' | 'code'
          created_at: string
          updated_at: string | null
          parent_id: string | null
          is_edited: boolean
          attachments: Json[] | null
        }
        Insert: {
          id?: string
          channel_id: string
          user_id: string
          content: string
          type?: 'text' | 'code'
          created_at?: string
          updated_at?: string | null
          parent_id?: string | null
          is_edited?: boolean
          attachments?: Json[] | null
        }
        Update: {
          id?: string
          channel_id?: string
          user_id?: string
          content?: string
          type?: 'text' | 'code'
          created_at?: string
          updated_at?: string | null
          parent_id?: string | null
          is_edited?: boolean
          attachments?: Json[] | null
        }
      }
      reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string
          full_name: string | null
          avatar_url: string | null
          status: 'online' | 'offline' | 'away' | 'dnd'
          updated_at: string | null
        }
        Insert: {
          id: string
          created_at?: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          status?: 'online' | 'offline' | 'away' | 'dnd'
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          status?: 'online' | 'offline' | 'away' | 'dnd'
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_channel_member: {
        Args: {
          channel_id: string
          user_id: string
        }
        Returns: boolean
      }
      is_channel_admin: {
        Args: {
          channel_id: string
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 