import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/personas`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get bot personas');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting bot personas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get bot personas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { bot_id, persona } = await request.json();

    if (!bot_id || !persona || typeof bot_id !== 'string' || typeof persona !== 'string') {
      return NextResponse.json(
        { error: 'bot_id and persona are required and must be strings' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidPattern = /^00000000-0000-0000-0000-000000000b\d{2}$/;
    if (!uuidPattern.test(bot_id)) {
      return NextResponse.json(
        { error: 'Invalid bot_id format. Must be a valid bot UUID' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/personas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({ bot_id, persona }),
    });

    if (!response.ok) {
      throw new Error('Failed to update bot persona');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating bot persona:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update bot persona' },
      { status: 500 }
    );
  }
} 