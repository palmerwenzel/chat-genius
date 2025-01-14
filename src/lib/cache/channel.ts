import { unstable_cache } from 'next/cache';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];

export const getChannelById = unstable_cache(
  async (channelId: string) => {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) {
      logger.error('channel.getById', error, { channelId });
      return null;
    }

    return data;
  },
  ['channel-by-id'],
  { revalidate: 300 } // 5 minutes
);

export const getChannelByName = unstable_cache(
  async (groupId: string, channelName: string) => {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('group_id', groupId)
      .eq('name', channelName)
      .single();

    if (error) {
      logger.error('channel.getByName', error, { groupId, channelName });
      return null;
    }

    return data;
  },
  ['channel-by-name'],
  { revalidate: 300 }
);

// Invalidate cache when channel is updated
export async function invalidateChannelCache(channelId: string) {
  await Promise.all([
    unstable_cache(() => null, ['channel-by-id', channelId])(),
    unstable_cache(() => null, ['channel-by-name', channelId])()
  ]);
} 