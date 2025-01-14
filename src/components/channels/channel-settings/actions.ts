'use server';

import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];

export async function updateChannel(channelId: string, data: { name?: string; description?: string | null }) {
  const supabase = await getSupabaseServer();

  try {
    const { error } = await supabase
      .from('channels')
      .update(data)
      .eq('id', channelId);

    if (error) throw error;

    revalidatePath('/chat');
    return { 
      success: true,
      message: 'Channel updated successfully'
    };
  } catch (error) {
    logger.error('channel.update', error);
    return { error: 'Failed to update channel' };
  }
}

export async function deleteChannel(channelId: string) {
  const supabase = await getSupabaseServer();

  try {
    // Check if user has permission to delete channel
    const { data: members, error: membersError } = await supabase
      .from('channel_members')
      .select('role')
      .eq('channel_id', channelId);

    if (membersError) throw membersError;

    if (members.length === 0) {
      return { error: 'Channel not found' };
    }

    // Delete channel
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId);

    if (error) throw error;

    revalidatePath('/chat');
    return { 
      success: true,
      message: 'Channel deleted successfully'
    };
  } catch (error) {
    logger.error('channel.delete', error);
    return { error: 'Failed to delete channel' };
  }
}

export async function getChannel(channelId: string): Promise<{ channel?: Channel; error?: string }> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) throw error;

    return { channel: data };
  } catch (error) {
    logger.error('channel.get', error);
    return { error: 'Failed to load channel' };
  }
} 