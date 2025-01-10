import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Check if this is a protected route
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/chat')
    || req.nextUrl.pathname.startsWith('/api/search')
    || req.nextUrl.pathname.startsWith('/api/messages');

  if (isProtectedRoute) {
    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Verify user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (error || !user) {
      // Clear auth cookies and redirect to login
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', req.url))
    }
  } else {
    // For non-protected routes, just refresh the session
    await supabase.auth.getSession()
  }

  return res
}

// Ensure the middleware is only applied to relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 