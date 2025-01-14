# Linting Issues Checklist

## Summary of Issues
The linting errors fall into these main categories:

1. [ ] Unused Variables/Imports (TypeScript no-unused-vars)
2. [ ] Explicit `any` Types (TypeScript no-explicit-any)
3. [ ] Accessibility Issues (jsx-a11y)
4. [x] Parsing Errors

## Details by Category

### 1. Unused Variables/Imports
- [x] `src/app/(chat)/actions.ts`: ~~Remove unused `FileMetadata`~~ (KEEP: Used as type documentation for message attachments)
- [x] `src/components/chat/channel-sidebar/index.tsx`: ~~Remove unused `getSupabaseServer`~~ (Fixed: Removed import and corrected path to getChannelMembers)
- [x] `src/components/chat/chat-interface/index.tsx`: ~~Remove unused `groupId`~~ (KEEP: Required for routing structure and future group-specific features)
- [x] `src/components/sidebar/sidebar-nav/actions.ts`: ~~Remove unused `revalidatePath` and `Channel`~~ (REMOVE revalidatePath, KEEP Channel interface for typing and schema consistency)
- [x] `src/hooks/usePresenceSubscription.ts`: ~~Remove unused `Database`~~ (Fixed: Now properly used for presence types and fixed incorrect imports)
- [x] `src/lib/cache/channel.ts`: ~~Remove unused `Channel`~~ (KEEP: Now properly used for return type annotations)
- [ ] `src/types/search.ts`: Remove unused `Database`

### 2. Explicit `any` Types
- [ ] `src/app/(chat)/groups/actions.ts`: Line 20:27
- [x] `src/hooks/usePresenceSubscription.ts`: Line 10:18 (Fixed: Replaced [key: string]: any with proper interface properties)
- [ ] `src/lib/logger.ts`: Lines 4:18, 17:15, 23:35

### 3. Accessibility Issues
- [ ] `src/components/messages/message-input/client.tsx`: Add alt text to image element (Line 145:19)

### 4. Parsing Errors
- [x] `src/contexts/chat.ts`: Fixed by removing the template file since we have the complete implementation in `chat.tsx`

## Action Plan
1. ✅ ~~Start with the parsing error in chat.ts~~ (Resolved by removing duplicate template file)
2. Clean up unused variables and imports (In Progress)
   - Found that some "unused" items are actually used indirectly
   - Some imports need path corrections rather than removal
   - Some props like `groupId` are needed for routing/future features
   - Type interfaces often needed for schema consistency even if not directly referenced
   - Fixed incorrect supabase server import path
   - Fixed incorrect supabase client import and usage
   - Added proper return type annotations to functions
3. Add proper TypeScript types to replace `any`
4. Add alt text to the image element for accessibility

## Notes
- Most issues are TypeScript-specific and relate to code quality rather than functionality
- ~~The parsing error in chat.ts should be investigated first as it might indicate a more serious issue~~ (Resolved)
- Consider adding TypeScript strict mode if not already enabled to catch these issues earlier
- Some "unused" variables are actually used indirectly or serve as documentation
- Props that seem unused might be needed for routing structure or future features
- Type interfaces should be kept even if not directly referenced if they serve as schema documentation
- Be careful with database types and ensure proper type assertions when working with Supabase responses
- Pay attention to the exact file names and exports when fixing import paths
- Remember to await async functions that return promises (like getSupabaseServer) 