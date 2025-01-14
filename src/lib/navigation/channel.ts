import { cache } from 'react';
import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { logger } from '@/lib/logger';

export const getChannelPath = cache(async (channelId: string) => {
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from('channels')
    .select(`
      name,
      groups!inner (
        name
      )
    `)
    .eq('id', channelId)
    .single();

  if (error) {
    logger.error('channel.getPath', error, { channelId });
    return null;
  }

  if (!data) return null;

  return `/chat/${data.groups.name}/${data.name}`;
});

export const getChannelFromPath = cache(async (groupName: string, channelName: string) => {
  const supabase = await getSupabaseServer();
  
  // First get the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('name', groupName)
    .single();

  if (groupError) {
    logger.error('channel.fromPath.group', groupError, { groupName });
    return null;
  }

  if (!group) return null;

  // Then get the channel
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('*')
    .eq('group_id', group.id)
    .eq('name', channelName)
    .single();

  if (channelError) {
    logger.error('channel.fromPath.channel', channelError, { 
      groupId: group.id, 
      channelName 
    });
    return null;
  }

  return channel;
}); 