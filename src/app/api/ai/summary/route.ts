import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { aiService } from '@/services/ai';
import type { Database } from '@/types/supabase';

export async function POST(request: Request) {
  try {
    const { channelId } = await request.json();

    if (!channelId) {
      return NextResponse.json(
        { error: 'Missing channelId' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch channel messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        content,
        users:sender_id (
          name
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Format messages for summary generation
    const formattedMessages = messages.map(msg => ({
      content: msg.content,
      sender: msg.users?.[0]?.name || 'Unknown User'
    }));

    // Generate summary
    const summary = await aiService.generateSummary(formattedMessages);

    // Store summary as a message
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        channel_id: channelId,
        sender_id: user.id,
        content: summary,
        type: 'text',
        metadata: {
          is_bot: true,
          is_summary: true
        }
      });

    if (insertError) {
      console.error('Error inserting summary:', insertError);
      return NextResponse.json(
        { error: 'Failed to store summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('Error in summary endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 