# Supabase Refactor Checklist

Below is a checklist of all files in the codebase that reference or interact with Supabase (auth, routes, or other functionality). Each item describes why it needs to be refactored and suggests next steps for aligning with the newer Supabase docs and the utility functions under `@/utils/supabase/`.

---

## 1. src/utils/supabase/client.ts
• Description: Creates a browser-based Supabase client using createBrowserClient().
• Action:  
  - Confirm that only client components import from this file.  
  - Rename the function to something consistent like `createBrowserSupabaseClient` if needed, or keep it as is but ensure all browser-based calls rely on it.  
  - Remove any direct references to Supabase in client components that do not use this utility.  

## 2. src/utils/supabase/server.ts
• Description: Creates a server-based Supabase client using createServerClient().
• Action:  
  - Confirm that only server components or API routes import from this file.  
  - Rename function to something consistent (e.g. `createServerSupabaseClient`) if necessary.  
  - Ensure all server-side code (especially RSC, API routes, etc.) depends on this file.  

## 3. src/utils/supabase/middleware.ts
• Description: A custom middleware function that refreshes user sessions by creating a server Supabase client.
• Action:  
  - Validate the logic thoroughly against the Supabase docs; confirm that the flow aligns with recommended best practices for session-based authentication.  
  - Make sure it correctly handles cookies and only redirects unauthenticated users when needed.  
  - Where feasible, unify with or replace any separate middleware logic in the repo so there is a single, standard approach.  

## 4. middleware.ts (at project root)
• Description: Another middleware entry that calls into the code in @/utils/supabase/middleware.
• Action:  
  - Confirm that the `matcher` config is correct and that it seamlessly calls `updateSession`.  
  - Review all routes to ensure the expected ones are guarded (e.g. /login, /auth, /chat, etc.).  
  - Remove or consolidate any duplicated logic with `src/middleware.ts` if both exist.  

## 5. src/middleware.ts
• Description: Similar HTTP middleware for route protection or session refreshing (appears to overlap with the root-level middleware).
• Action:  
  - Verify which middleware file is actually used by Next.js (v13+ typically expects middleware in project root).  
  - Remove this file or unify with the root-level `middleware.ts` if it is redundant.  
  - Update references so that only one middleware path is in play.  

## 6. src/app/api/auth/check/route.ts
• Description: Performs an auth check using createRouteHandlerClient() and responds with session status.
• Action:  
  - Replace any references to direct Supabase calls with `@/utils/supabase/server` if it is a server route.  
  - Ensure it uses the recommended `createServerSupabaseClient()` approach from the docs.  
  - Remove any repeated logic for cookie handling (the server utility should manage that).  

## 7. src/app/auth/callback/route.ts
• Description: Exchanges OAuth codes with Supabase and redirects user.
• Action:  
  - Use the new server-based client from `@/utils/supabase/server` if this route is a server route.  
  - Double-check redirection logic adheres to Supabase docs (especially the “exchangeCodeForSession” usage).  

## 8. src/app/api/search/route.ts
• Description: Fetches the user session, then queries your custom search service (searchService).
• Action:  
  - Switch from `createRouteHandlerClient()` to a unified `createServerSupabaseClient()` if preferred.  
  - Confirm that only server functionality is in use here (no direct client logic).  
  - Remove any leftover references to the older client-based approach.  

## 9. src/lib/server-supabase.ts
• Description: Creates a server component client with createServerComponentClient().
• Action:  
  - Merge with `@/utils/supabase/server.ts` if they both do similar tasks.  
  - Eliminate the duplication. Only keep a single server utility with consistent naming.  

## 10. src/services/auth.ts
• Description: Contains various methods (signIn, signUp, getSession) that create or manage Supabase sessions.
• Action:  
  - For server calls, use the newly centralized server utilities.  
  - For client calls, import from `@/utils/supabase/client`.  
  - Consider splitting purely server-side logic (like getSession checks) into a server utility so this becomes a small, client-focused service.  

## 11. src/services/search.ts
• Description: Uses createClientComponentClient() from `@supabase/auth-helpers-nextjs`.
• Action:  
  - Validate that search is only done on the client if it truly needs browser context. Otherwise, move to a server-based approach with `@/utils/supabase/server`.  
  - Ensure any user session calls or auth checks rely on the single recommended strategy.  

## 12. src/app/__tests__/auth-redirects.test.tsx
• Description: Tests related to authentication flow and potentially references supabase or router mocks.
• Action:  
  - Make sure the tests now import any refactored client or server code from `@/utils/supabase/`.  
  - Update stubs/mocks so they reflect the new standard approach (client vs. server).  

## 13. src/tests/database/rls.test.ts (and any other test files directly calling Supabase)
• Description: Tests that call supabase with admin or user clients for RLS checks.
• Action:  
  - Switch to the updated approach from the docs if the new server/client utilities can also be used in tests.  
  - Validate environment variable usage remains consistent.  
  - Make sure these test clients are created in line with Next.js+Supabase best practices.  

## 14. Potential New Files
• You may wish to create:  
  - A new `@/utils/supabase/test.ts` file for test utilities if you want to keep a distinct approach for integration tests or seeding.  
  - A `@/utils/supabase/helpers.ts` for any repeated logic that is not purely server or client but needs to be shared.  

## 15. Potential Deletions
• Delete or merge duplicative files:
  - `src/lib/server-supabase.ts` if it duplicates `src/utils/supabase/server.ts`.  
  - Extra middleware files so there is only one canonical `middleware.ts`.  

---

## Next Steps Summary

1. Unify Server-Side Logic  
   - Consolidate all server-based Supabase calls into `src/utils/supabase/server.ts`.  
   - Eliminate duplicate server logic in `src/lib/server-supabase.ts`, `src/utils/supabase/middleware.ts`, or route definitions.

2. Unify Client-Side Logic  
   - Use `src/utils/supabase/client.ts` for all client-based calls.  
   - Make sure client components do not directly instantiate Supabase but rely on your shared utilities.

3. Single Middleware Strategy  
   - Remove or merge multiple `middleware.ts` files. Keep one at the root of the project with the logic from `@/utils/supabase/middleware.ts`.

4. Update Routes and Tests  
   - Check every route (e.g., in `src/app/api/*`) to ensure usage of the new server utility.  
   - Update test files to instantiate Supabase with the correct approach.

5. Documentation  
   - Update any references in internal docs (development and README files) to reflect the new standard usage paths for server/client.

This checklist should guide your refactor to align with the official Supabase + Next.js patterns. Adjust naming and structure as needed to match your style, but aim for a single source of truth for server utilities and one for client utilities.