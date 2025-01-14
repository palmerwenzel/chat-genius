// Database type is required for Message and Channel type definitions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Database } from '@/types/supabase';
import type { Message } from '@/types/messages';
import type { Channel } from '@/types/channels';

/**
 * Represents a search result item which can be either a Message or Channel
 * Note: Both Message and Channel types are derived from Database['public']['Tables']
 */
export interface SearchResult {
  type: 'message' | 'channel';
  item: Message | Channel;
  highlight: string;
  score: number;
}

/**
 * Options for filtering and paginating search results
 */
export interface SearchOptions {
  limit?: number;
  offset?: number;
  channelId?: string;
  groupId?: string;
  userId?: string;
  type?: 'message' | 'channel';
  startDate?: Date;
  endDate?: Date;
}

/**
 * Response from a search operation containing paginated results
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
} 