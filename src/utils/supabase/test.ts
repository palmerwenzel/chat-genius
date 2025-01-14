import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Initialize clients with proper environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Admin client with service role access for test setup and cleanup
 */
export const createAdminClient = () => 
  createClient<Database>(supabaseUrl, serviceRoleKey)

/**
 * Create a test client with user authentication
 */
export const createTestClient = () => 
  createClient<Database>(supabaseUrl, supabaseAnonKey)

export interface TestUser {
  user: { id: string } | null
  client: SupabaseClient<Database>
}

/**
 * Create a test user and return their authenticated client
 */
export async function createTestUser(email: string, name: string): Promise<TestUser> {
  const adminClient = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: 'testpassword123',
    email_confirm: true
  })

  if (authError) throw authError

  // Create user profile
  const { error: profileError } = await adminClient
    .from('users')
    .insert({ id: authData.user.id, name, email })

  if (profileError) throw profileError

  // Create client for this user
  const client = createTestClient()
  await client.auth.signInWithPassword({ email, password: 'testpassword123' })

  return { user: authData.user, client }
}

/**
 * Delete a test user and clean up their data
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const adminClient = createAdminClient()
  await adminClient.auth.admin.deleteUser(userId)
} 