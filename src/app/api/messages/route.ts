import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { handleSupabaseError } from '@/utils/supabase/helpers';
import { MessageService } from '@/services/messages';

/**
 * GET /api/messages
 * Get messages for a channel with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const messageService = new MessageService(supabase);

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
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (!channelId) {
      return NextResponse.json({ error: 'Missing channelId parameter' }, { status: 400 });
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ error: 'Invalid offset parameter' }, { status: 400 });
    }

    // Get messages
    const messages = await messageService.getChannelMessages(channelId, limit, offset);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/messages
 * Create a new message
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const messageService = new MessageService(supabase);

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
    const { channelId, content } = body;

    // Validate parameters
    if (!channelId) {
      return NextResponse.json({ error: 'Missing channelId parameter' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid content parameter' }, { status: 400 });
    }

    // Create message
    const message = await messageService.createMessage({
      channel_id: channelId,
      user_id: session.user.id,
      content: content.trim()
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating message:', handleSupabaseError(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 