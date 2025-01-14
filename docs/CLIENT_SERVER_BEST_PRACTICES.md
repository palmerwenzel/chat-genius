# Next.js App Router + Supabase Best Practices

## Overview
This document summarizes our recommended approach for dividing client vs. server code in a Next.js project that uses Supabase for authentication, database operations, and real-time functionality. We reference the folder structure in this codebase.

## File Structure

1. **Server Components**:
   - Placed in Next.js route handlers (e.g., `app/(auth)/callback/route.ts`) or server-only page/layout files.
   - Use the server-side Supabase instance from `lib/supabase/supabaseServer.ts`.
   - Fetch data that must be done securely or that depends on server environment secrets.

2. **Client Components**:
   - Placed in `components/` or used within client-side Next.js pages.
   - Use the browser Supabase client from `lib/supabase/supabaseClient.ts`.
   - Must be declared `"use client";` at the top of the file.

3. **Middleware**:
   - Manages session tokens, ensures that only valid users can access certain routes.
   - Implemented in `lib/supabase/supabaseMiddleware.ts` and configured in `middleware.ts` or inside your Next.js route handlers as needed.

## Example of File Relationships

Given a route like `app/(chat)/[groupId]/[channelId]/page.tsx` (Server Component), you might:

1. Fetch Supabase data from the server using:
   ```ts
   const supabase = getSupabaseServer();
   const { data: { user } } = await supabase.auth.getUser();
   ```
2. Pass minimal data or session tokens to the Client Component (if needed).
3. In your Client Component (e.g., `ChatInterface.tsx`), use:
   ```ts
   "use client";

   import { getSupabaseClient } from "@/lib/supabase/supabaseClient";
   const supabase = getSupabaseClient();
   ```
   to subscribe to real-time changes, post messages, etc.

## Do’s and Don’ts

- **Do** keep secrets and server logic in server components or route handlers.
- **Do** access user sessions in server components (where possible) to prevent potential token tampering on the client.
- **Do** keep UI interactivity in client components.
- **Don’t** pass entire supabase client from client to server or vice versa.
- **Don’t** mutate cookies directly in client components or server components. Let the server logic or middleware handle it.
- **Do** limit the data you pass to client components.

## Summary
Following these guidelines ensures a clear boundary between server and client code, maintains security, and leverages Next.js App Router’s features effectively.