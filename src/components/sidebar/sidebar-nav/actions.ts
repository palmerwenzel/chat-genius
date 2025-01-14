'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface Group {
  id: string;
  name: string;
  description?: string;
  role: 'owner' | 'admin' | 'member' | 'none';
  visibility: 'public' | 'private';
}

interface Channel {
  id: string;
  name: string;
  visibility: 'public' | 'private';
}

export async function getInitialData(userId: string) {
  const supabase = getSupabaseServer();

  try {
    // Get both member groups and public groups
    const [memberGroups, publicGroups] = await Promise.all([
      // Get groups where user is a member
      supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          visibility,
          group_members!inner (
            role,
            user_id
          )
        `)
        .eq('group_members.user_id', userId),
      
      // Get public groups
      supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          visibility,
          group_members!left (
            role,
            user_id
          )
        `)
        .eq('visibility', 'public')
    ]);

    if (memberGroups.error) throw memberGroups.error;
    if (publicGroups.error) throw publicGroups.error;

    // Combine and deduplicate groups
    const allGroups = [...memberGroups.data];
    publicGroups.data.forEach(publicGroup => {
      if (!allGroups.some(g => g.id === publicGroup.id)) {
        allGroups.push(publicGroup);
      }
    });

    // Sort by name
    allGroups.sort((a, b) => a.name.localeCompare(b.name));

    const groups: Group[] = allGroups.map(group => {
      const membership = group.group_members?.find(m => m.user_id === userId);
      return {
        id: group.id,
        name: group.name,
        description: group.description || undefined,
        role: membership?.role || 'none',
        visibility: group.visibility
      };
    });

    return { groups };
  } catch (error) {
    console.error('Error loading initial data:', error);
    throw new Error('Failed to load sidebar data');
  }
}

export async function getGroupChannels(groupId: string, userId: string) {
  const supabase = getSupabaseServer();

  try {
    // Get both member channels and public channels
    const [memberChannels, publicChannels] = await Promise.all([
      // Get channels where user is a member
      supabase
        .from('channels')
        .select(`
          id,
          name,
          visibility,
          channel_members!inner (
            user_id
          )
        `)
        .eq('group_id', groupId)
        .eq('channel_members.user_id', userId),
      
      // Get public channels
      supabase
        .from('channels')
        .select(`
          id,
          name,
          visibility
        `)
        .eq('group_id', groupId)
        .eq('visibility', 'public')
    ]);

    if (memberChannels.error) throw memberChannels.error;
    if (publicChannels.error) throw publicChannels.error;

    // Combine and deduplicate channels
    const allChannels = [...memberChannels.data].map(channel => ({
      id: channel.id,
      name: channel.name,
      visibility: channel.visibility
    }));
    
    publicChannels.data.forEach(publicChannel => {
      if (!allChannels.some(c => c.id === publicChannel.id)) {
        allChannels.push(publicChannel);
      }
    });

    // Sort by name
    allChannels.sort((a, b) => a.name.localeCompare(b.name));

    return { channels: allChannels };
  } catch (error) {
    console.error('Error loading channels:', error);
    throw new Error('Failed to load channels');
  }
}

export async function getFirstAvailableChannel(groupId: string, userId: string) {
  const supabase = getSupabaseServer();

  try {
    // Get first available channel (either public or user is member)
    const [memberChannels, publicChannels] = await Promise.all([
      // Get channels where user is a member
      supabase
        .from('channels')
        .select('name')
        .eq('group_id', groupId)
        .eq('channel_members.user_id', userId)
        .order('name')
        .limit(1),
      
      // Get public channels
      supabase
        .from('channels')
        .select('name')
        .eq('group_id', groupId)
        .eq('visibility', 'public')
        .order('name')
        .limit(1)
    ]);

    if (memberChannels.error) throw memberChannels.error;
    if (publicChannels.error) throw publicChannels.error;

    return {
      channelName: memberChannels.data[0]?.name || publicChannels.data[0]?.name
    };
  } catch (error) {
    console.error('Error finding first available channel:', error);
    throw new Error('Failed to find available channel');
  }
} 