import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { createTestUser, deleteTestUser } from '@/utils/supabase/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Test user clients
let aliceClient: SupabaseClient<Database>
let bobClient: SupabaseClient<Database>

// Keep track of created users for cleanup
const createdUserIds: string[] = []

describe('Database Schema and RLS Tests', () => {
  beforeAll(async () => {
    // Create test users and get their clients
    const aliceData = await createTestUser('alice@example.com', 'Alice')
    const bobData = await createTestUser('bob@example.com', 'Bob')

    if (aliceData.user?.id) createdUserIds.push(aliceData.user.id)
    if (bobData.user?.id) createdUserIds.push(bobData.user.id)

    aliceClient = aliceData.client
    bobClient = bobData.client

    // Log test users creation
    console.log('Test users created:', {
      alice: aliceData.user?.id,
      bob: bobData.user?.id
    })
  })

  afterAll(async () => {
    // Clean up all created test users
    for (const userId of createdUserIds) {
      await deleteTestUser(userId)
    }
  })

  describe('Users Table RLS', () => {
    it('should allow users to view all profiles', async () => {
      const { data, error } = await aliceClient.from('users').select('*')
      expect(error).toBeNull()
      expect(data!.length).toBeGreaterThan(0)
    })

    it('should prevent users from updating other users profiles', async () => {
      const { data: bobProfile } = await bobClient.from('users').select('*').limit(1).single()
      const { error } = await aliceClient
        .from('users')
        .update({ name: 'Hacked Name' })
        .eq('id', bobProfile!.id)
      
      expect(error).not.toBeNull()
      expect(error!.code).toBe('42501') // PostgreSQL permission denied error code
    })

    it('enforces name length constraint', async () => {
      const { error } = await aliceClient
        .from('users')
        .update({ name: 'a'.repeat(101) })
        .eq('id', (await aliceClient.auth.getUser()).data.user!.id)

      expect(error).toBeDefined()
      expect(error!.message).toContain('check')
    })
  })

  describe('Channels Table RLS', () => {
    it('should allow creating public channels', async () => {
      // Get current user session for debugging
      const { data: { session } } = await aliceClient.auth.getSession()
      console.log('Current user session:', {
        userId: session?.user?.id,
        email: session?.user?.email
      })

      // Attempt channel creation
      const { data, error } = await aliceClient.from('channels').insert({
        name: 'Public Test Channel',
        description: 'Test Description',
        visibility: 'public',
        type: 'text',
        created_by: session?.user?.id
      }).select().single()

      // Log the result
      console.log('Channel creation attempt:', {
        data,
        error,
        sql: error?.details,
        hint: error?.hint,
        code: error?.code
      })

      expect(error).toBeNull()
      expect(data!.name).toBe('Public Test Channel')
    })

    it('should automatically add creator as owner', async () => {
      // Get current user session for debugging
      const { data: { session } } = await aliceClient.auth.getSession()
      console.log('Current user session:', {
        userId: session?.user?.id,
        email: session?.user?.email
      })

      // Attempt channel creation
      const { data: channel, error: channelError } = await aliceClient.from('channels')
        .insert({
          name: 'Test Channel',
          type: 'text',
          visibility: 'public',
          created_by: session?.user?.id
        })
        .select()
        .single()

      // Log channel creation result
      console.log('Channel creation attempt:', {
        channel,
        error: channelError,
        sql: channelError?.details,
        hint: channelError?.hint,
        code: channelError?.code
      })

      if (channelError) {
        throw new Error(`Channel creation failed: ${channelError.message}`)
      }

      // Verify channel member creation
      const { data: membership, error: memberError } = await aliceClient
        .from('channel_members')
        .select('*')
        .eq('channel_id', channel!.id)
        .single()

      // Log membership check result
      console.log('Channel membership check:', {
        membership,
        error: memberError,
        sql: memberError?.details,
        hint: memberError?.hint,
        code: memberError?.code
      })

      expect(membership!.role).toBe('owner')
    })

    it('should prevent non-members from viewing private channels', async () => {
      // Get current user sessions for debugging
      const { data: { session: aliceSession } } = await aliceClient.auth.getSession()
      const { data: { session: bobSession } } = await bobClient.auth.getSession()
      
      console.log('Test user sessions:', {
        alice: { id: aliceSession?.user?.id, email: aliceSession?.user?.email },
        bob: { id: bobSession?.user?.id, email: bobSession?.user?.email }
      })

      // Create private channel
      const { data: channel, error: createError } = await aliceClient.from('channels')
        .insert({
          name: 'Private Channel',
          visibility: 'private',
          created_by: aliceSession?.user?.id
        })
        .select()
        .single()

      // Log channel creation result
      console.log('Private channel creation:', {
        channel,
        error: createError,
        sql: createError?.details,
        hint: createError?.hint,
        code: createError?.code
      })

      if (createError) {
        throw new Error(`Private channel creation failed: ${createError.message}`)
      }

      // Attempt to view with Bob's client
      const { data: bobView, error: viewError } = await bobClient
        .from('channels')
        .select()
        .eq('id', channel!.id)

      // Log view attempt result
      console.log('Non-member view attempt:', {
        data: bobView,
        error: viewError,
        sql: viewError?.details,
        hint: viewError?.hint,
        code: viewError?.code
      })

      expect(bobView!.length).toBe(0)
    })

    it('enforces channel name length constraint', async () => {
      const { error } = await aliceClient
        .from('channels')
        .insert({
          name: 'a'.repeat(101),
          created_by: (await aliceClient.auth.getUser()).data.user!.id
        })

      expect(error).toBeDefined()
      expect(error!.message).toContain('check')
    })
  })
}) 