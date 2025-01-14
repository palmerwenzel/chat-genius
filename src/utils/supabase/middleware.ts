import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

/**
 * Middleware function to handle Supabase authentication.
 * This function:
 * 1. Creates a Supabase server client with proper cookie handling
 * 2. Refreshes the session if needed
 * 3. Redirects unauthenticated users to login for protected routes
 * 4. Maintains cookie state between requests
 * 
 * @param request The incoming Next.js request
 * @returns NextResponse with updated cookie state
 */
export async function updateSession(request: NextRequest) {
  // Initialize response object to track cookie changes
  let response = NextResponse.next({
    request: request.clone(),
  })

  // IMPORTANT: Do not run any code between createServerClient and
  // supabase.auth.getUser(). A simple mistake here could make it very hard to debug
  // issues with users being randomly logged out.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string) {
          const cookie: RequestCookie = {
            name,
            value,
          }
          request.cookies.set(cookie)
          // IMPORTANT: You must create a new response object and copy over the cookies
          // each time you want to update the response. If you don't, you may cause
          // the browser and server to go out of sync and terminate user sessions.
          response = NextResponse.next({
            request: request.clone(),
          })
          response.cookies.set(cookie)
        },
        remove(name: string) {
          request.cookies.delete(name)
          response = NextResponse.next({
            request: request.clone(),
          })
          response.cookies.delete(name)
        },
      },
    }
  )

  // IMPORTANT: Get the user session to refresh it if needed.
  // This MUST be called immediately after creating the client.
  // DO NOT remove this call or add any code between client creation and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/auth']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without authentication
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    // Preserve the original URL as a redirect parameter
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // IMPORTANT: You *must* return the response object as is.
  // If you're creating a new response object, make sure to:
  // 1. Pass the request in it
  // 2. Copy over all cookies
  // 3. Avoid changing cookie state after this point
  // Otherwise, you may cause the browser and server to go out of sync
  // and terminate user sessions prematurely!
  return response
}