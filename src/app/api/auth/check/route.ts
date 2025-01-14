import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

/**
 * GET /api/auth/check
 * Checks if the user is authenticated and returns their session info
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Auth check failed:', error.message)
      return NextResponse.json(
        { error: 'Authentication check failed' },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        lastSignInAt: session.user.last_sign_in_at,
        // Add any other needed user fields here
      },
    })
  } catch (error) {
    console.error('Unexpected error in auth check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 