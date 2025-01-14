import type { Database } from '@/types/supabase';
import type { Message } from '@/types/messages';
import type { Channel } from '@/types/channels';

export interface SearchResult {
  type: 'message' | 'channel';
  item: Message | Channel;
  highlight: string;
  score: number;
}

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

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
} 