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
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          visibility: 'public' | 'private'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          visibility?: 'public' | 'private'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          visibility?: 'public' | 'private'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          group_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          group_id: string
          name: string
          description: string | null
          type: 'text' | 'voice'
          visibility: 'public' | 'private'
          created_by: string
          created_at: string
          updated_at: string
          fts: unknown
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          description?: string | null
          type?: 'text' | 'voice'
          visibility?: 'public' | 'private'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          description?: string | null
          type?: 'text' | 'voice'
          visibility?: 'public' | 'private'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      channel_members: {
        Row: {
          channel_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          channel_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
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
          sender_id: string
          content: string
          type: 'text'
          metadata: Json
          replying_to_id: string | null
          thread_id: string | null
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          fts: unknown
        }
        Insert: {
          id?: string
          channel_id: string
          sender_id: string
          content: string
          type?: 'text'
          metadata?: Json
          replying_to_id?: string | null
          thread_id?: string | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          channel_id?: string
          sender_id?: string
          content?: string
          type?: 'text'
          metadata?: Json
          replying_to_id?: string | null
          thread_id?: string | null
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
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
      file_metadata: {
        Row: {
          id: string
          name: string
          size: number
          mime_type: string
          storage_key: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          size: number
          mime_type: string
          storage_key: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          size?: number
          mime_type?: string
          storage_key?: string
          created_by?: string
          created_at?: string
        }
      }
      presence: {
        Row: {
          user_id: string
          status: 'online' | 'offline' | 'idle' | 'dnd'
          last_seen: string
        }
        Insert: {
          user_id: string
          status?: 'online' | 'offline' | 'idle' | 'dnd'
          last_seen?: string
        }
        Update: {
          user_id?: string
          status?: 'online' | 'offline' | 'idle' | 'dnd'
          last_seen?: string
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