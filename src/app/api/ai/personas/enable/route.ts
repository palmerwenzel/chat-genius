import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { botId } = await request.json();

    if (!botId || typeof botId !== 'number' || botId < 1 || botId > 10) {
      return NextResponse.json(
        { error: 'Valid bot ID between 1 and 10 is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/personas/enable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({ botId }),
    });

    if (!response.ok) {
      throw new Error('Failed to enable bot');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error enabling bot:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enable bot' },
      { status: 500 }
    );
  }
} 