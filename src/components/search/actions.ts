'use server';

import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { logger } from '@/lib/logger';
import type { SearchOptions, SearchResponse, SearchResult } from '@/types/search';
import type { Message } from '@/types/messages';
import type { Channel } from '@/types/channels';

const DEFAULT_LIMIT = 20;

/**
 * Search across messages and channels
 */
export async function search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
  const supabase = await getSupabaseServer();
  const {
    limit = DEFAULT_LIMIT,
    offset = 0,
    channelId,
    groupId,
    userId,
    type,
    startDate,
    endDate,
  } = options;

  try {
    // Format search terms
    const messageSearchTerms = query.split(/\s+/).map(term => `'${term}'`).join(' & ');
    const channelSearchTerms = query.split(/\s+/).map(term => `'${term}'`).join(' | ');
    
    logger.info('search.start', { query, type, channelId, groupId });

    const results: SearchResult[] = [];
    let total = 0;

    // Search messages if requested
    if (!type || type === 'message') {
      let messageQuery = supabase
        .from('messages')
        .select('*, channel:channels!inner(*)', { count: 'exact' })
        .textSearch('fts', messageSearchTerms);

      // Apply filters
      if (channelId) {
        messageQuery = messageQuery.eq('channel_id', channelId);
      } else if (groupId) {
        messageQuery = messageQuery.eq('channel.group_id', groupId);
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

      const { data: messages, count: messageCount, error: messageError } = await messageQuery
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (messageError) {
        logger.error('search.messages', messageError, { query, channelId, groupId });
      } else if (messages) {
        results.push(...messages.map(message => ({
          type: 'message' as const,
          item: message as Message,
          highlight: extractHighlight(message.content, query),
          score: calculateScore(message.content, query),
        })));
        total += messageCount || 0;
      }
    }

    // Search channels if requested
    if (!type || type === 'channel') {
      let channelQuery = supabase
        .from('channels')
        .select('*', { count: 'exact' })
        .textSearch('fts', channelSearchTerms);

      // Apply filters
      if (groupId) {
        channelQuery = channelQuery.eq('group_id', groupId);
      }
      if (userId) {
        channelQuery = channelQuery.eq('created_by', userId);
      }
      if (startDate) {
        channelQuery = channelQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        channelQuery = channelQuery.lte('created_at', endDate.toISOString());
      }

      const { data: channels, count: channelCount, error: channelError } = await channelQuery
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (channelError) {
        logger.error('search.channels', channelError, { query, groupId });
      } else if (channels) {
        results.push(...channels.map(channel => ({
          type: 'channel' as const,
          item: channel as Channel,
          highlight: extractHighlight(channel.name + ' ' + (channel.description || ''), query),
          score: calculateScore(channel.name + ' ' + (channel.description || ''), query),
        })));
        total += channelCount || 0;
      }
    }

    // Sort results by score
    results.sort((a, b) => b.score - a.score);

    logger.info('search.complete', { 
      query, 
      type, 
      total, 
      resultCount: results.length 
    });

    return {
      results,
      total,
      hasMore: total > offset + limit,
    };
  } catch (error) {
    logger.error('search', error, { query, options });
    throw error;
  }
}

/**
 * Extract a relevant snippet from the content with highlighted query terms
 */
function extractHighlight(content: string, query: string): string {
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
function calculateScore(content: string, query: string): number {
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