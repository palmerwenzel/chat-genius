import { NextResponse } from 'next/server';

interface SeedRequest {
  prompt: string;
  num_turns?: number;
  bots?: number[];
  channelId: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, num_turns = 3, bots, channelId } = body as SeedRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate bot numbers if provided
    if (bots) {
      const validBots = bots.every(bot => 
        typeof bot === 'number' && bot >= 1 && bot <= 10
      );
      if (!validBots) {
        return NextResponse.json(
          { error: 'Invalid bot numbers. Must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    console.log('Seeding conversation:', {
      prompt,
      num_turns,
      bots: bots || 'default',
      channelId
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({ prompt, num_turns, bots, channelId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('RAG service error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData?.detail || 'Failed to seed conversation');
    }

    const data = await response.json();
    console.log('Conversation seeded successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error seeding conversation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed conversation' },
      { status: 500 }
    );
  }
} 