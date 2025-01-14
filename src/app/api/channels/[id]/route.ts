import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { handleSupabaseError } from '@/utils/supabase/helpers';

/**
 * GET /api/channels/[id]
 * Get a channel by its ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get channel by ID
    const channel = await supabase
      .from('channels')
      .select()
      .eq('id', params.id)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('Error fetching channel:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/channels/[id]
 * Update a channel's details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get update data
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate update data
    const { name, description } = body;
    if (name !== undefined && (typeof name !== 'string' || name.length < 1)) {
      return NextResponse.json({ error: 'Invalid channel name' }, { status: 400 });
    }
    if (description !== undefined && (typeof description !== 'string')) {
      return NextResponse.json({ error: 'Invalid description' }, { status: 400 });
    }

    // Update channel
    const { data, error } = await supabase
      .from('channels')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating channel:', handleSupabaseError(error));
      return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
    }

    return NextResponse.json({ channel: data });
  } catch (error) {
    console.error('Error updating channel:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/channels/[id]
 * Delete a channel
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error fetching session:', handleSupabaseError(sessionError));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete channel
    const { error: deleteError } = await supabase
      .from('channels')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting channel:', handleSupabaseError(deleteError));
      return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting channel:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 