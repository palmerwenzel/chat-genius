import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { searchService } from '@/services/search';

export type SearchType = 'message' | 'channel';

interface SearchOptions {
  type?: SearchType;
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset: number;
  userId: string;
}

/**
 * GET /api/search
 * Searches messages and channels based on query parameters.
 * Requires authentication.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const type = url.searchParams.get('type') as SearchType | undefined;
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100); // Cap at 100
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0); // Ensure non-negative

    // Validate required parameters
    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Get current user session
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('Auth error in search:', authError.message);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse dates if provided
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Validate date parameters if provided
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate format' },
        { status: 400 }
      );
    }
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid endDate format' },
        { status: 400 }
      );
    }

    // Prepare search options
    const options: SearchOptions = {
      type,
      startDate,
      endDate,
      limit,
      offset,
      userId: session.user.id,
    };

    const results = await searchService.search(query, options);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 