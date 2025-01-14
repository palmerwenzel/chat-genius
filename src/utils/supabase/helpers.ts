import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Shared types for Supabase database tables
 */
export type Tables = Database['public']['Tables']
export type User = Tables['users']['Row']
export type Channel = Tables['channels']['Row']
export type Message = Tables['messages']['Row']
export type ChannelMember = Tables['channel_members']['Row']

interface SupabaseErrorDetails {
  message: string
  details?: string
  hint?: string
  code?: string
}

/**
 * Common error handling for Supabase operations
 */
export function handleSupabaseError(error: unknown): SupabaseErrorDetails | null {
  if (!error) return null

  console.error('Supabase operation failed:', error)
  
  if (error instanceof Error) {
    if ((error as PostgrestError).details) {
      const pgError = error as PostgrestError
      return {
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint,
        code: pgError.code,
      }
    }
    return {
      message: error.message,
    }
  }

  return {
    message: 'An unexpected error occurred',
  }
}

/**
 * Check if a user has specific role in a channel
 */
export async function checkChannelRole(
  client: SupabaseClient<Database>,
  channelId: string,
  userId: string,
  role: ChannelMember['role']
): Promise<boolean> {
  const { data } = await client
    .from('channel_members')
    .select('role')
    .eq('channel_id', channelId)
    .eq('user_id', userId)
    .single()

  return data?.role === role
}

/**
 * Get user profile with optional fields
 */
export async function getUserProfile(
  client: SupabaseClient<Database>,
  userId: string,
  select = '*, channels:channel_members(channel:channels(*))'
) {
  const { data, error } = await client
    .from('users')
    .select(select)
    .eq('id', userId)
    .single()

  if (error) {
    handleSupabaseError(error)
    return null
  }

  return data
}

/**
 * Format Supabase timestamp to locale string
 */
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString()
} 