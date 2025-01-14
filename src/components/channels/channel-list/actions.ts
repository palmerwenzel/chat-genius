'use server';

import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'] & {
  unread_count?: number;
  category?: string;
};

export async function getChannels(groupId: string): Promise<{ channels?: Channel[]; error?: string }> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        unread_count:channel_messages(count)
      `)
      .eq('group_id', groupId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return { channels: data as Channel[] };
  } catch (error) {
    logger.error('channels.list.get', error);
    return { error: 'Failed to load channels' };
  }
}

export async function getChannelByName(groupId: string, channelName: string): Promise<{ channel?: Channel; error?: string }> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('group_id', groupId)
      .eq('name', channelName)
      .single();

    if (error) throw error;

    return { channel: data as Channel };
  } catch (error) {
    logger.error('channels.get.byName', error);
    return { error: 'Channel not found' };
  }
} 