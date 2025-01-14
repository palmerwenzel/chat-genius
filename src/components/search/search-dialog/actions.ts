'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import type { SearchResult, Message, Channel } from '@/services/search';

export async function searchContent(params: {
  query: string;
  type: 'channel' | 'message';
  channelId?: string;
  groupId?: string;
}): Promise<{ results: SearchResult[] }> {
  const supabase = getSupabaseServer();
  const { query, type, channelId, groupId } = params;

  try {
    if (!query) {
      return { results: [] };
    }

    // Search channels
    if (type === 'channel') {
      const { data: channels, error } = await supabase
        .from('channels')
        .select('id, name, description, created_at')
        .textSearch('name', query)
        .eq('group_id', groupId)
        .limit(10);

      if (error) throw error;

      const results: SearchResult[] = channels.map(channel => ({
        type: 'channel',
        item: channel as Channel,
        highlight: `**${channel.name}** - ${channel.description || ''}`
      }));

      return { results };
    }

    // Search messages
    if (type === 'message') {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          channel_id,
          channels (
            id,
            name
          )
        `)
        .textSearch('content', query)
        .eq('channel_id', channelId)
        .limit(20);

      if (error) throw error;

      const results: SearchResult[] = messages.map(message => ({
        type: 'message',
        item: {
          ...message,
          channel: message.channels
        } as Message & { channel?: Channel },
        highlight: message.content
      }));

      return { results };
    }

    return { results: [] };
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to perform search');
  }
} 