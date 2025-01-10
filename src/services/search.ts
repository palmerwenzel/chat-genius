import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

export type Message = Database['public']['Tables']['messages']['Row'];
export type Channel = Database['public']['Tables']['channels']['Row'];

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

class SearchService {
  private readonly DEFAULT_LIMIT = 20;

  /**
   * Search across messages and channels
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const {
      limit = this.DEFAULT_LIMIT,
      offset = 0,
      channelId,
      userId,
      type,
      startDate,
      endDate,
    } = options;

    // Build message search query
    console.log('Starting search with query:', query);

    // Format the query for websearch - messages use AND for more precise matching
    const messageSearchTerms = query.split(/\s+/).map(term => `'${term}'`).join(' & ');
    // Channels use OR for more flexible matching
    const channelSearchTerms = query.split(/\s+/).map(term => `'${term}'`).join(' | ');
    
    console.log('Formatted message query:', messageSearchTerms);
    console.log('Formatted channel query:', channelSearchTerms);

    let messageQuery = supabase
      .from('messages')
      .select('*, channel:channels(*)', { count: 'exact' })
      .textSearch('fts', messageSearchTerms);

    // Apply message filters
    if (channelId) {
      messageQuery = messageQuery.eq('channel_id', channelId);
    }
    if (userId) {
      messageQuery = messageQuery.eq('sender_id', userId);
    }
    if (startDate) {
      messageQuery = messageQuery.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      messageQuery = messageQuery.lte('created_at', endDate.toISOString());
    }

    // Build channel search query
    let channelQuery = supabase
      .from('channels')
      .select('*', { count: 'exact' })
      .textSearch('fts', channelSearchTerms);

    // Apply channel filters
    if (userId) {
      channelQuery = channelQuery.eq('created_by', userId);
    }
    if (startDate) {
      channelQuery = channelQuery.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      channelQuery = channelQuery.lte('created_at', endDate.toISOString());
    }

    // Execute queries based on type
    const results: SearchResult[] = [];
    let total = 0;

    if (!type || type === 'message') {
      console.log('Executing message search query...');
      const { data: messages, count: messageCount, error: messageError } = await messageQuery
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (messageError) {
        console.error('Error searching messages:', messageError);
        console.error('Message query details:', {
          query,
          userId,
          channelId,
          startDate,
          endDate
        });
      } else if (messages) {
        console.log('Message search results:', {
          count: messageCount,
          messages: messages?.map(m => ({ id: m.id, content: m.content }))
        });
        results.push(...messages.map(message => ({
          type: 'message' as const,
          item: message,
          highlight: this.extractHighlight(message.content, query),
          score: this.calculateScore(message.content, query),
        })));
        total += messageCount || 0;
      }
    }

    if (!type || type === 'channel') {
      console.log('Executing channel search query...');
      const { data: channels, count: channelCount, error: channelError } = await channelQuery
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (channelError) {
        console.error('Error searching channels:', channelError);
        console.error('Channel query details:', {
          query,
          userId,
          startDate,
          endDate
        });
      } else if (channels) {
        console.log('Channel search results:', {
          count: channelCount,
          channels: channels?.map(c => ({ id: c.id, name: c.name, description: c.description }))
        });
        results.push(...channels.map(channel => ({
          type: 'channel' as const,
          item: channel,
          highlight: this.extractHighlight(channel.name + ' ' + (channel.description || ''), query),
          score: this.calculateScore(channel.name + ' ' + (channel.description || ''), query),
        })));
        total += channelCount || 0;
      }
    }

    // Sort results by score
    results.sort((a, b) => b.score - a.score);

    console.log('Final search results:', {
      query,
      type,
      total,
      hasMore: total > offset + limit,
      resultCount: results.length,
      results: results.map(r => ({
        type: r.type,
        id: r.item.id,
        highlight: r.highlight,
        score: r.score
      }))
    });

    return {
      results,
      total,
      hasMore: total > offset + limit,
    };
  }

  /**
   * Extract a relevant snippet from the content with highlighted query terms
   */
  private extractHighlight(content: string, query: string): string {
    const words = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    // Find the best matching segment
    let bestStart = 0;
    const bestLength = 150;
    let maxMatches = 0;

    for (let i = 0; i < content.length; i++) {
      let matches = 0;
      for (const word of words) {
        if (contentLower.slice(i, i + bestLength).includes(word)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestStart = i;
      }
    }

    // Extract and highlight the segment
    let highlight = content.slice(bestStart, bestStart + bestLength);
    
    // Add ellipsis if needed
    if (bestStart > 0) {
      highlight = '...' + highlight;
    }
    if (bestStart + bestLength < content.length) {
      highlight = highlight + '...';
    }

    // Highlight matching terms
    for (const word of words) {
      const regex = new RegExp(word, 'gi');
      highlight = highlight.replace(regex, match => `**${match}**`);
    }

    return highlight;
  }

  /**
   * Calculate relevance score for sorting
   */
  private calculateScore(content: string, query: string): number {
    const words = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let score = 0;
    for (const word of words) {
      // Exact matches are worth more
      const exactMatches = (contentLower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      score += exactMatches * 2;

      // Partial matches are worth less
      const partialMatches = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += partialMatches;
    }

    // Bonus for matching all words
    if (words.every(word => contentLower.includes(word))) {
      score *= 1.5;
    }

    return score;
  }
}

// Export a singleton instance
export const searchService = new SearchService(); 