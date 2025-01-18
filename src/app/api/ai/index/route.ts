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

interface Message {
  role: string;
  content: string;
  metadata: MessageMetadata;
}

interface IndexMessagesRequest {
  messages: Message[];
}

interface IndexMessagesResponse {
  status: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json() as IndexMessagesRequest;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('No messages provided or invalid messages format');
      return NextResponse.json(
        { error: 'No messages provided or invalid format' },
        { status: 400 }
      );
    }

    console.log(`Indexing ${messages.length} messages`);
    if (messages.length > 0) {
      console.log('First message:', messages[0]);
      console.log('Last message:', messages[messages.length - 1]);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/index`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`
        },
        body: JSON.stringify({ messages })
      }
    );

    if (!response.ok) {
      console.error(`RAG service error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to index messages');
    }

    const data = await response.json() as IndexMessagesResponse;
    console.log('Messages indexed successfully:', data.message);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in message indexing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to index messages' },
      { status: 500 }
    );
  }
} 