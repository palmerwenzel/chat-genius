import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { handleSupabaseError } from '@/utils/supabase/helpers';
import { UserService } from '@/services/users';

/**
 * GET /api/users/[id]
 * Get a user by their ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get user by ID
    const user = await userService.getUserById(params.id);
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
 * PATCH /api/users/[id]
 * Update a user's profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify user is updating their own profile
    if (params.id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to update this profile' }, { status: 403 });
    }

    // Get update data
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate update data
    const { username, full_name, avatar_url } = body;
    if (username !== undefined && (typeof username !== 'string' || username.length < 3)) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }
    if (full_name !== undefined && (typeof full_name !== 'string')) {
      return NextResponse.json({ error: 'Invalid full name' }, { status: 400 });
    }
    if (avatar_url !== undefined && (typeof avatar_url !== 'string')) {
      return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 });
    }

    // Update user
    const updatedUser = await userService.updateUser(params.id, {
      username,
      full_name,
      avatar_url
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 