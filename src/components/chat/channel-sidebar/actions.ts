'use server';

import { getSupabaseServer } from '@/app/lib/supabase/server';
import type { Database } from '@/types/supabase';

type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

type PresenceRecord = {
  status: PresenceStatus;
  custom_status: string | null;
  last_active: string;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  presence: PresenceRecord[];
};

type MemberRecord = {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  users: UserRecord;
};

interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member';
  status: PresenceStatus;
  custom_status?: string | null;
}

function sortMembers(members: Member[]): Member[] {
  return members.sort((a, b) => {
    // First sort by online status
    if (a.status !== 'offline' && b.status === 'offline') return -1;
    if (a.status === 'offline' && b.status !== 'offline') return 1;

    // Then by role
    const roleOrder: Record<Member['role'], number> = { owner: 0, admin: 1, member: 2 };
    if (roleOrder[a.role] !== roleOrder[b.role]) {
      return roleOrder[a.role] - roleOrder[b.role];
    }

    // Finally by name
    return a.name.localeCompare(b.name);
  });
}

export async function getChannelMembers(groupId: string, channelId: string): Promise<Member[]> {
  const supabase = await getSupabaseServer();

  // First check if it's a public group
  const { data: group } = await supabase
    .from('groups')
    .select('visibility')
    .eq('id', groupId)
    .single();

  const isPublicGroup = group?.visibility === 'public';

  // Get members based on group type
  if (isPublicGroup) {
    const { data: members } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar_url,
        presence (
          status,
          custom_status,
          last_active
        )
      `)
      .order('name');

    const formattedMembers = (members || []).map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      avatar_url: member.avatar_url,
      role: 'member' as const,
      status: (member.presence?.[0]?.status || 'offline') as PresenceStatus,
      custom_status: member.presence?.[0]?.custom_status
    }));

    return sortMembers(formattedMembers);
  } else {
    // For private groups, get channel members with their roles
    const { data: members } = await supabase
      .from('channel_members')
      .select(`
        role,
        users!inner (
          id,
          name,
          email,
          avatar_url,
          presence (
            status,
            custom_status,
            last_active
          )
        )
      `)
      .eq('channel_id', channelId);

    const formattedMembers = (members || []).map(member => ({
      id: member.users.id,
      name: member.users.name,
      email: member.users.email,
      avatar_url: member.users.avatar_url,
      role: member.role as 'owner' | 'admin' | 'member',
      status: (member.users.presence?.[0]?.status || 'offline') as PresenceStatus,
      custom_status: member.users.presence?.[0]?.custom_status
    }));

    return sortMembers(formattedMembers);
  }
} 