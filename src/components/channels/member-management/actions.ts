'use server';

import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import type { Database } from '@/types/supabase';

type Member = Database['public']['Tables']['channel_members']['Row'] & {
  profiles: Database['public']['Tables']['users']['Row'];
};

export async function getChannelMembers(channelId: string): Promise<{ members?: Member[]; error?: string }> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('channel_members')
      .select(`
        *,
        profiles:users (*)
      `)
      .eq('channel_id', channelId);

    if (error) throw error;

    return { members: data as Member[] };
  } catch (error) {
    logger.error('channel.members.get', error);
    return { error: 'Failed to load members' };
  }
}

export async function addChannelMember(channelId: string, userId: string, role: 'member' | 'admin' = 'member') {
  const supabase = await getSupabaseServer();

  try {
    // Check if user exists
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!user) {
      return { error: 'User not found' };
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return { error: 'User is already a member of this channel' };
    }

    // Add member
    const { error: addError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channelId,
        user_id: userId,
        role,
      });

    if (addError) throw addError;

    revalidatePath('/chat');
    return { 
      success: true,
      message: 'Member added successfully'
    };
  } catch (error) {
    logger.error('channel.members.add', error);
    return { error: 'Failed to add member' };
  }
}

export async function updateMemberRole(channelId: string, userId: string, role: 'member' | 'admin' | 'owner') {
  const supabase = await getSupabaseServer();

  try {
    const { error } = await supabase
      .from('channel_members')
      .update({ role })
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath('/chat');
    return { 
      success: true,
      message: 'Member role updated successfully'
    };
  } catch (error) {
    logger.error('channel.members.updateRole', error);
    return { error: 'Failed to update member role' };
  }
}

export async function removeChannelMember(channelId: string, userId: string) {
  const supabase = await getSupabaseServer();

  try {
    // Check if last owner
    const { data: owners } = await supabase
      .from('channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('role', 'owner');

    if (owners?.length === 1 && owners[0].id === userId) {
      return { error: 'Cannot remove the last owner of the channel' };
    }

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath('/chat');
    return { 
      success: true,
      message: 'Member removed successfully'
    };
  } catch (error) {
    logger.error('channel.members.remove', error);
    return { error: 'Failed to remove member' };
  }
} 