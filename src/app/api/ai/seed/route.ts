import { NextResponse } from 'next/server';

interface SeedRequest {
  prompt: string;
  num_turns?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, num_turns = 3 } = body as SeedRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Seeding conversation:', {
      prompt,
      num_turns
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({ prompt, num_turns }),
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