import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_RAG_SERVICE_URL}/api/index/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_RAG_SERVICE_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reset index');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error resetting index:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset index' },
      { status: 500 }
    );
  }
} 