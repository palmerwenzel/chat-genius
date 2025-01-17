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
    const { personas } = await request.json();

    if (!personas || typeof personas !== 'object') {
      return NextResponse.json(
        { error: 'Personas object is required' },
        { status: 400 }
      );
    }

    // Validate persona format
    const validPersonaKeys = Object.keys(personas).every(key => 
      key.match(/^bot\d+_persona$/) && 
      typeof personas[key] === 'string' &&
      parseInt(key.match(/\d+/)?.[0] || '0') >= 1 &&
      parseInt(key.match(/\d+/)?.[0] || '0') <= 10
    );

    if (!validPersonaKeys) {
      return NextResponse.json(
        { error: 'Invalid persona format. Each key should be botN_persona where N is 1-10' },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/personas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
      body: JSON.stringify({ personas }),
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