import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { handleSupabaseError } from '@/utils/supabase/helpers';

/**
 * POST /api/auth/logout
 * Signs out the current user and clears their session
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('Error signing out:', handleSupabaseError(signOutError));
      return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error during logout:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 