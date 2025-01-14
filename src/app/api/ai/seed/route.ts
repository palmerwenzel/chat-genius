import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { aiService } from '@/services/ai';
import type { Database } from '@/types/supabase';

if (!process.env.BOT_USER_1_ID || !process.env.BOT_USER_2_ID) {
  throw new Error('Missing bot user configuration');
}

export async function POST(request: Request) {
  try {
    const { channelId, prompt } = await request.json();

    if (!channelId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Generate conversation
    const messages = await aiService.generateConversation(prompt);

    // Store messages in database
    const { error: insertError } = await supabase
      .from('messages')
      .insert(
        messages.map((message, index) => ({
          channel_id: channelId,
          sender_id: index % 2 === 0 ? process.env.BOT_USER_1_ID : process.env.BOT_USER_2_ID,
          content: message.content,
          type: 'text',
          metadata: {
            is_bot: true,
            bot_number: (index % 2) + 1
          }
        }))
      );

    if (insertError) {
      console.error('Error inserting messages:', insertError);
      return NextResponse.json(
        { error: 'Failed to store messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in seed endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 