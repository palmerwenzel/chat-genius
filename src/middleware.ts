import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Extract the user via getUser (revalidates token).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginRoute = req.nextUrl.pathname.startsWith('/login')

  // If user is found and this is the login page, send them to /chat instead.
  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL('/chat', req.url))
  }

  // Check if this route needs protection. 
  // Adjust to cover all routes that should only be accessible if authed.
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith('/chat') ||
    req.nextUrl.pathname.startsWith('/api/search') ||
    req.nextUrl.pathname.startsWith('/api/messages')

  // For protected routes, if there is no user, redirect to /login.
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If neither condition triggers, allow request through.
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