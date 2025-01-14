import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

/**
 * GET /auth/callback
 * Handles the OAuth callback from Supabase Auth.
 * Exchanges the code for a session and redirects to the appropriate page.
 */
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Get the intended destination, defaulting to /chat
    const next = requestUrl.searchParams.get('next') || '/chat'
    const redirectTo = new URL(next, requestUrl.origin)

    if (!code) {
      console.error('No code provided in OAuth callback')
      // Redirect to login if no code (likely a direct visit to /auth/callback)
      return NextResponse.redirect(new URL('/login', requestUrl.origin))
    }

    const supabase = await createServerSupabaseClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Failed to exchange code for session:', error.message)
      // Redirect to login with error parameter
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'Authentication failed')
      return NextResponse.redirect(loginUrl)
    }

    // Successful authentication, redirect to the intended destination
    return NextResponse.redirect(redirectTo)
  } catch (error) {
    console.error('Unexpected error in OAuth callback:', error)
    // Redirect to login with generic error
    const loginUrl = new URL('/login', new URL(request.url).origin)
    loginUrl.searchParams.set('error', 'Something went wrong')
    return NextResponse.redirect(loginUrl)
  }
} 