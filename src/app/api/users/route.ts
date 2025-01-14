import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { handleSupabaseError } from '@/utils/supabase/helpers';
import { UserService } from '@/services/users';

/**
 * GET /api/users
 * Get a user by ID or username
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const userService = new UserService(supabase);

    // Verify auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const username = searchParams.get('username');

    // Validate parameters
    if (!id && !username) {
      return NextResponse.json({ error: 'Missing id or username parameter' }, { status: 400 });
    }

    // Get user by ID or username
    let user = null;
    if (id) {
      user = await userService.getUserById(id);
    } else if (username) {
      user = await userService.getUserByUsername(username);
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/users
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const userService = new UserService(supabase);

    // Verify auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { username, full_name, avatar_url } = body;

    // Validate parameters
    if (!username && !full_name && !avatar_url) {
      return NextResponse.json({ error: 'No update parameters provided' }, { status: 400 });
    }

    // Build update params
    const updateParams: Record<string, string> = {};
    if (username) {
      if (typeof username !== 'string' || username.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid username parameter' }, { status: 400 });
      }
      updateParams.username = username.trim();
    }
    if (full_name) {
      if (typeof full_name !== 'string') {
        return NextResponse.json({ error: 'Invalid full_name parameter' }, { status: 400 });
      }
      updateParams.full_name = full_name.trim();
    }
    if (avatar_url) {
      if (typeof avatar_url !== 'string' || !avatar_url.startsWith('http')) {
        return NextResponse.json({ error: 'Invalid avatar_url parameter' }, { status: 400 });
      }
      updateParams.avatar_url = avatar_url;
    }

    // Update user
    const user = await userService.updateUser(session.user.id, updateParams);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 