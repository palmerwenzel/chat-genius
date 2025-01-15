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
    const { bot1_persona, bot2_persona } = await request.json();

    if (!bot1_persona || !bot2_persona) {
      return NextResponse.json(
        { error: 'Both bot personas are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/personas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({ bot1_persona, bot2_persona }),
    });

    if (!response.ok) {
      throw new Error('Failed to update bot personas');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating bot personas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update bot personas' },
      { status: 500 }
    );
  }
} 