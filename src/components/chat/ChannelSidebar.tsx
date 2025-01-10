'use client';

import { SearchButton } from '@/components/search/SearchButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { PostgrestError } from '@supabase/supabase-js';

type Member = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member';
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status?: string;
};

type MemberResponse = {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  users: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  presence: {
    status: 'online' | 'idle' | 'dnd' | 'offline';
    custom_status: string | null;
  } | null;
};

interface ChannelSidebarProps {
  channelId: string;
  groupId: string;
  className?: string;
}

export function ChannelSidebar({ channelId, groupId, className }: ChannelSidebarProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function loadMembers() {
      // Fetch channel members
      const { data: channelMembers, error: channelError } = await supabase
        .from('channel_members')
        .select(`
          user_id,
          role,
          users (
            id,
            name,
            email,
            avatar_url
          ),
          presence!left (
            status,
            custom_status
          )
        `)
        .eq('channel_id', channelId) as { data: MemberResponse[] | null; error: PostgrestError | null };

      if (channelError) {
        console.error('Error loading channel members:', channelError);
        return;
      }

      if (!channelMembers) return;

      // Fetch group members who aren't in the channel
      const { data: groupMembers, error: groupError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          role,
          users (
            id,
            name,
            email,
            avatar_url
          ),
          presence!left (
            status,
            custom_status
          )
        `)
        .eq('group_id', groupId)
        .not('user_id', 'in', `(${channelMembers.map(m => m.user_id).join(',')})`) as { data: MemberResponse[] | null; error: PostgrestError | null };

      if (groupError) {
        console.error('Error loading group members:', groupError);
        return;
      }

      if (!groupMembers) return;

      // Combine and format members
      const formattedMembers = [
        ...channelMembers.map(m => ({
          id: m.users.id,
          name: m.users.name,
          email: m.users.email,
          avatar_url: m.users.avatar_url,
          role: m.role,
          status: m.presence?.status || 'offline',
          custom_status: m.presence?.custom_status || undefined
        })),
        ...groupMembers.map(m => ({
          id: m.users.id,
          name: m.users.name,
          email: m.users.email,
          avatar_url: m.users.avatar_url,
          role: m.role,
          status: m.presence?.status || 'offline',
          custom_status: m.presence?.custom_status || undefined
        }))
      ];

      // Sort members: online first, then by role (owner > admin > member), then by name
      const sortedMembers = formattedMembers.sort((a, b) => {
        // First sort by online status
        if (a.status !== 'offline' && b.status === 'offline') return -1;
        if (a.status === 'offline' && b.status !== 'offline') return 1;

        // Then by role
        const roleOrder = { owner: 0, admin: 1, member: 2 };
        if (roleOrder[a.role] !== roleOrder[b.role]) {
          return roleOrder[a.role] - roleOrder[b.role];
        }

        // Finally by name
        return a.name.localeCompare(b.name);
      });

      setMembers(sortedMembers);
    }

    loadMembers();

    // Subscribe to presence changes
    const channel = supabase.channel('presence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
        },
        () => {
          // Reload members when presence changes
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      member.status === 'online' && 'bg-green-500',
                      member.status === 'idle' && 'bg-yellow-500',
                      member.status === 'dnd' && 'bg-red-500',
                      member.status === 'offline' && 'bg-gray-300'
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <UserRound className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm flex items-center gap-1">
                        {member.name}
                        {member.role !== 'member' && (
                          <span className="text-xs text-muted-foreground">
                            ({member.role})
                          </span>
                        )}
                      </span>
                      {member.custom_status && (
                        <span className="text-xs text-muted-foreground">
                          {member.custom_status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
} 