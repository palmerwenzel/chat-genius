import { NextResponse } from 'next/server';

interface MessageMetadata {
  is_bot?: boolean;
  bot_number?: number;
  sender_name?: string;
  is_summary?: boolean;
  is_command_response?: boolean;
  type?: 'channel_message' | 'system_message' | 'command_response';
  [key: string]: string | number | boolean | undefined;
}

interface RAGMessage {
  role: string;
  content: string;
  metadata: MessageMetadata;
  channel_id?: string;
  group_id?: string;
  sender_id?: string;
  created_at?: string;
}

interface SummaryRequest {
  messages: RAGMessage[];
  query?: string;
  filter?: {
    channel_id?: string;
    group_id?: string;
    sender_id?: string;
  };
}

// Add constant for system bot ID
const SYSTEM_BOT_ID = '00000000-0000-0000-0000-000000000000';  // System Bot

export async function POST(request: Request) {
  try {
    const { messages, query, filter } = await request.json() as SummaryRequest;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('No messages provided or invalid messages format');
      return NextResponse.json(
        { error: 'No messages provided or invalid format' },
        { status: 400 }
      );
    }

    console.log(`Generating summary for ${messages.length} messages`);
    if (query) {
      console.log(`With query focus: ${query}`);
    }
    if (filter) {
      console.log(`Applying filters:`, filter);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/summary`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`
        },
        body: JSON.stringify({
          messages,
          query,
          filter_metadata: filter
        })
      }
    );

    if (!response.ok) {
      console.error(`RAG service error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to generate summary');
    }

    const data = await response.json();
    console.log('Summary generated successfully');
    
    // Include the system bot ID in the response
    return NextResponse.json({
      ...data,
      system_bot_id: SYSTEM_BOT_ID
    });
  } catch (error) {
    console.error('Error in summary generation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 