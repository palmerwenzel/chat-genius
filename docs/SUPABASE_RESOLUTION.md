# Supabase Refactor Checklist

Below is a checklist of all files in the codebase that reference or interact with Supabase (auth, routes, or other functionality). Each item describes why it needs to be refactored and suggests next steps for aligning with the newer Supabase docs and the utility functions under `@/utils/supabase/`.

---

## 1. src/utils/supabase/client.ts ✅
• Description: Creates a browser-based Supabase client using createBrowserClient().
• Status: COMPLETED
  - Renamed to createBrowserSupabaseClient for clarity
  - Added JSDoc documentation
  - Confirmed using latest @supabase/ssr package
  - No direct references to old function found

## 2. src/utils/supabase/server.ts ✅
• Description: Creates a server-based Supabase client using createServerClient().
• Status: COMPLETED
  - Renamed to createServerSupabaseClient for clarity
  - Added comprehensive JSDoc documentation
  - Confirmed using latest @supabase/ssr package
  - Cookie handling implementation verified

## 3. src/utils/supabase/middleware.ts ✅
• Description: A custom middleware function that refreshes user sessions by creating a server Supabase client.
• Status: COMPLETED
  - Updated to use latest @supabase/ssr practices
  - Improved cookie handling with proper typing
  - Added redirect URL preservation
  - Added comprehensive JSDoc documentation
  - Expanded public routes configuration
  - Fixed all TypeScript linting issues

## 4. middleware.ts (at project root) ✅
• Description: Another middleware entry that calls into the code in @/utils/supabase/middleware.
• Status: COMPLETED
  - Confirmed correct usage of updateSession utility
  - Updated matcher config to exclude static assets and public files
  - Consolidated route protection logic from src/middleware.ts
  - Removed duplicate middleware implementation

## 5. src/middleware.ts ✅
• Description: Similar HTTP middleware for route protection or session refreshing (appears to overlap with the root-level middleware).
• Status: COMPLETED
  - Verified Next.js v13+ middleware location (root is correct)
  - Removed duplicate file after consolidating logic
  - All references now point to root middleware.ts

## 6. src/app/api/auth/check/route.ts ✅
• Description: Performs an auth check using createRouteHandlerClient() and responds with session status.
• Status: COMPLETED
  - Replaced createRouteHandlerClient with createServerSupabaseClient
  - Added proper error handling with logging
  - Improved response structure and status codes
  - Added JSDoc documentation
  - Removed redundant cookie handling

## 7. src/app/auth/callback/route.ts ✅
• Description: Exchanges OAuth codes with Supabase and redirects user.
• Status: COMPLETED
  - Replaced createRouteHandlerClient with createServerSupabaseClient
  - Added comprehensive error handling with logging
  - Improved redirect logic with error states
  - Added JSDoc documentation
  - Added fallback redirects for error cases
  - Preserved next/redirect URL functionality

## 8. src/app/api/search/route.ts ✅
• Description: Fetches the user session, then queries your custom search service (searchService).
• Status: COMPLETED
  - Replaced createRouteHandlerClient with createServerSupabaseClient
  - Added proper TypeScript interfaces for search options
  - Improved parameter validation and sanitization
  - Added comprehensive error handling with logging
  - Added request parameter limits (max limit, non-negative offset)
  - Added date validation
  - Removed unused imports

## 9. src/lib/server-supabase.ts ✅
• Description: Creates a server component client with createServerComponentClient().
• Status: COMPLETED
  - Removed duplicate server utility file
  - Updated all imports in chat layout and pages
  - Migrated to new createServerSupabaseClient
  - Verified functionality in server components
  - Removed old @supabase/auth-helpers-nextjs dependency usage

## 10. src/services/auth.ts ✅
• Description: Contains various methods (signIn, signUp, getSession) that create or manage Supabase sessions.
• Status: COMPLETED
  - Migrated to new createBrowserSupabaseClient
  - Added proper JSDoc documentation
  - Improved TypeScript types with OAuthProvider
  - Removed global client instance for better isolation
  - Added clear client-side usage warnings
  - Improved code organization and consistency

## 11. src/services/search.ts ✅
• Description: Uses createClientComponentClient() from `@supabase/auth-helpers-nextjs`.
• Status: COMPLETED
  - Migrated to createServerSupabaseClient
  - Added proper JSDoc documentation
  - Improved code organization
  - Added clear server-side usage warnings
  - Removed global client instance
  - Improved TypeScript types and interfaces
  - Maintained existing search functionality

## 12. src/app/__tests__/auth-redirects.test.tsx ✅
• Description: Tests related to authentication flow and potentially references supabase or router mocks.
• Status: COMPLETED
  - Updated mocks to use new utilities
  - Added auth service mocking
  - Added Supabase client utility mocking
  - Improved test organization
  - Added OAuth redirect verification
  - Maintained existing test coverage

## 13. src/tests/database/rls.test.ts ✅
• Description: Tests that call supabase with admin or user clients for RLS checks.
• Status: COMPLETED
  - Created new test utilities in @/utils/supabase/test.ts
  - Added proper test client creation functions
  - Added test user management utilities
  - Improved test organization and readability
  - Maintained existing test coverage
  - Fixed linting issues
  - Removed duplicate code

## 14. Potential New Files ✅
• Description: Additional utility files needed for better organization.
• Status: COMPLETED
  - Created @/utils/supabase/test.ts for test utilities
    - Added test client creation functions
    - Added test user management
    - Added proper TypeScript types
  - Created @/utils/supabase/helpers.ts for shared logic
    - Added shared database types
    - Added error handling utilities
    - Added common database operations
    - Added timestamp formatting

## 15. Potential Deletions ✅
• Description: Remove or merge duplicative files for cleaner codebase.
• Status: COMPLETED
  - Removed src/lib/server-supabase.ts (completed in Task #9)
  - Consolidated middleware files to single root middleware.ts (completed in Tasks #4 and #5)
  - Verified no remaining duplicate utilities
  - Confirmed all imports updated to new locations

---

## Next Steps Summary

### 1. Unify Server-Side Logic
Files to check/modify:
- [✅] src/app/(chat)/chat/[channelId]/page.tsx
- [✅] src/app/(chat)/chat/page.tsx
- [✅] src/app/(chat)/layout.tsx
- [✅] src/app/api/messages/route.ts
- [✅] src/app/api/channels/route.ts
- [✅] src/app/api/users/route.ts
- [✅] src/services/messages.ts
- [✅] src/services/channels.ts
- [✅] src/services/users.ts

### 2. Unify Client-Side Logic
Files to check/modify:
- [✅] src/components/auth/login-form.tsx
- [✅] src/components/auth/register-form.tsx
- [✅] src/components/channels/channel-form.tsx
- [✅] src/components/messages/message-form.tsx
- [✅] src/hooks/use-auth.ts
- [✅] src/hooks/use-channel.ts
- [✅] src/hooks/use-messages.ts
- [✅] src/stores/auth.ts
- [✅] src/stores/channel.ts

### 3. Single Middleware Strategy
Already completed in previous tasks:
- ✅ Consolidated to root middleware.ts
- ✅ Removed src/middleware.ts
- ✅ Updated all middleware imports

### 4. Update Routes and Tests
Files to check/modify:
- [✅] src/app/api/auth/callback/route.ts
- [✅] src/app/api/auth/check/route.ts
- [✅] src/app/api/auth/logout/route.ts
- [✅] src/app/api/channels/[id]/route.ts
- [✅] src/app/api/channels/route.ts
- [✅] src/app/api/messages/[id]/route.ts
- [✅] src/app/api/messages/route.ts
- [✅] src/app/api/users/[id]/route.ts
- [✅] src/app/api/users/route.ts
- [✅] src/tests/api/auth.test.ts
- [✅] src/tests/api/channels.test.ts
- [✅] src/tests/api/messages.test.ts
- [✅] src/tests/api/users.test.ts

### 5. Documentation
Files to check/modify:
- [ ] README.md
- [ ] docs/LOCAL_DEVELOPMENT.md
- [ ] docs/ARCHITECTURE.md
- [ ] docs/API.md
- [ ] docs/TESTING.md
- [ ] docs/DEPLOYMENT.md

Each file will be checked for:
1. Correct imports from @/utils/supabase
2. Proper usage of server vs client utilities
3. Consistent error handling
4. Type safety
5. Documentation accuracy

Would you like to start with any particular section?