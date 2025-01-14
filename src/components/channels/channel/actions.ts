'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/supabase';
import type { Channel } from '@/types/channels';

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
  reactions: Database['public']['Tables']['reactions']['Row'][];
};

export async function getChannelMessages(channelId: string, limit = 50, before?: string) {
  const supabase = getSupabaseServer();

  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users(
          id,
          name,
          avatar_url,
          email
        ),
        reactions(*)
      `)
      .eq('channel_id', channelId)
      .is('thread_id', null) // Only get main messages, not thread replies
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;
    return messages as MessageType[];
  } catch (error) {
    logger.error('channel.getMessages', error, { channelId });
    throw error;
  }
}

// Channel lookup functions
export async function getChannelById(channelId: string): Promise<Channel | null> {
  const supabase = getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('channel.getById', error, { channelId });
    throw error;
  }
}

export async function getChannelByName(groupId: string, channelName: string): Promise<Channel | null> {
  const supabase = getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('group_id', groupId)
      .eq('name', channelName)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('channel.getByName', error, { groupId, channelName });
    throw error;
  }
} 