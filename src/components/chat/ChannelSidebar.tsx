'use client';

import { SearchButton } from '@/components/search/SearchButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import Image from 'next/image';
import { useAuth } from '@/stores/auth';
import { StatusSelector } from '@/components/presence/StatusSelector';

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

interface ChannelSidebarProps {
  channelId: string;
  groupId: string;
  className?: string;
}

export function ChannelSidebar({ channelId, groupId, className }: ChannelSidebarProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const supabase = createClientComponentClient<Database>();
  const { user } = useAuth();

  useEffect(() => {
    async function loadMembers() {
      // First check if the group is public
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('visibility')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error loading group:', groupError);
        return;
      }

      const isPublicGroup = groupData?.visibility === 'public';
      console.log('Group visibility:', groupData?.visibility);

      // For public groups, get all users who have interacted with any channel in the group
      let allGroupMembers: MemberRecord[] = [];
      
      if (isPublicGroup) {
        // First get all presence records to ensure we have the latest status
        const { data: presenceData } = await supabase
          .from('presence')
          .select('*');

        console.log('Current presence data:', presenceData);

        const { data: activeUsers, error: activeUsersError } = await supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            avatar_url,
            presence!left (
              status,
              custom_status,
              last_active
            )
          `)
          .order('name');

        console.log('Active users data:', activeUsers);

        if (activeUsersError) {
          console.error('Error loading active users:', activeUsersError);
          return;
        }

        if (activeUsers) {
          allGroupMembers = activeUsers.map(user => ({
            user_id: user.id,
            role: 'member' as const,
            users: user as UserRecord
          }));
        }
      } else {
        // For private groups, get explicit group members
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select(`
            user_id,
            role,
            users!inner (
              id,
              name,
              email,
              avatar_url,
              presence!left (
                status,
                custom_status,
                last_active
              )
            )
          `)
          .eq('group_id', groupId);

        console.log('Private group members data:', members);

        if (membersError) {
          console.error('Error loading group members:', membersError);
          return;
        }

        if (members) {
          allGroupMembers = members as unknown as MemberRecord[];
        }
      }

      // Get channel members to determine roles and filter non-channel members
      const { data: channelMembers, error: channelError } = await supabase
        .from('channel_members')
        .select(`
          user_id,
          role,
          users!inner (
            id,
            name,
            email,
            avatar_url,
            presence!left (
              status,
              custom_status,
              last_active
            )
          )
        `)
        .eq('channel_id', channelId);

      console.log('Channel members data:', channelMembers);

      if (channelError) {
        console.error('Error loading channel members:', channelError);
        return;
      }

      // Create a map of channel member roles
      const channelMemberRoles = new Map(
        channelMembers?.map(m => [m.user_id, m.role]) || []
      );

      // Format all members, using channel roles where available
      const formattedMembers: Member[] = allGroupMembers.map(m => {
        const member: Member = {
          id: m.users.id,
          name: m.users.name,
          email: m.users.email,
          avatar_url: m.users.avatar_url,
          role: channelMemberRoles.get(m.user_id) || m.role,
          status: (m.users.presence?.[0]?.status || 'offline') as PresenceStatus,
          custom_status: m.users.presence?.[0]?.custom_status
        };
        console.log('Formatted member:', member);
        return member;
      });

      console.log('Final formatted members:', formattedMembers);

      // Sort members: online first, then by role (owner > admin > member), then by name
      const sortedMembers = formattedMembers.sort((a, b) => {
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

      setMembers(sortedMembers);
    }

    loadMembers();

    // Subscribe to presence changes for all members
    const presenceChannel = supabase.channel('presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence'
        },
        (payload) => {
          console.log('Presence change detected:', payload);
          loadMembers();
        }
      )
      .subscribe();

    // Subscribe to member changes
    const memberChannel = supabase.channel('member-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_members',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          loadMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      presenceChannel.unsubscribe();
      memberChannel.unsubscribe();
    };
  }, [channelId, groupId, supabase]);

  return (
    <div className={cn('w-[--sidebar-width] border-l flex flex-col', className)}>
      <div className="p-4 border-b">
        <SearchButton 
          className="w-full" 
          mode="message" 
          channelId={channelId}
          placeholder="Search messages..."
        />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Members ({members.length})
          </h3>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-4">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className={cn(
                    "flex items-center gap-2",
                    member.status === 'offline' && "opacity-50"
                  )}
                >
                  {member.id === user?.id ? (
                    <StatusSelector size="sm" />
                  ) : (
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        member.status === 'online' && 'bg-green-500',
                        member.status === 'idle' && 'bg-yellow-500',
                        member.status === 'dnd' && 'bg-red-500',
                        member.status === 'offline' && 'bg-gray-300'
                      )}
                    />
                  )}
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <UserRound className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-sm">{member.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
} 