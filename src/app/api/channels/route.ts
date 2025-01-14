import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { handleSupabaseError } from '@/utils/supabase/helpers';
import { ChannelService } from '@/services/channels';

/**
 * GET /api/channels
 * Get all channels or a specific channel by name
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const channelService = new ChannelService(supabase);

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
    const name = searchParams.get('name');

    // If name is provided, get specific channel
    if (name) {
      const channel = await channelService.getChannelByName(name);
      if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
      }
      return NextResponse.json({ channel });
    }

    // Otherwise, get all channels
    const channels = await channelService.getAllChannels();
    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Error fetching channels:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/channels
 * Create a new channel
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const channelService = new ChannelService(supabase);

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
    const { name, description } = body;

    // Validate parameters
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid name parameter' }, { status: 400 });
    }
    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Invalid description parameter' }, { status: 400 });
    }

    // Create channel
    const channel = await channelService.createChannel({
      name: name.trim(),
      description: description?.trim() || null,
      created_by: session.user.id
    });

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('Error creating channel:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 