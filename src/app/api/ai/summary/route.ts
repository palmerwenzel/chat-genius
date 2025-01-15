import { NextResponse } from 'next/server';

interface MessageMetadata {
  type?: string;
  sender?: string;
  timestamp?: string;
  is_bot?: boolean;
  bot_number?: number;
  sender_name?: string;
  [key: string]: string | number | boolean | undefined;
}

interface RAGMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: MessageMetadata;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages as RAGMessage[];
    const { query } = body;

    if (!messages?.length) {
      return NextResponse.json(
        { error: 'No messages provided for summary' },
        { status: 400 }
      );
    }

    console.log('Generating summary:', {
      count: messages.length,
      query: query || 'none',
      firstMessage: messages[0],
      lastMessage: messages[messages.length - 1]
    });

    // Call RAG service
    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({ 
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata
        })),
        query 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('RAG service error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData?.detail || 'Failed to generate summary');
    }

    const data = await response.json();
    console.log('Summary generated successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 