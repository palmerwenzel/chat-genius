"use client";

import { SearchButton } from '@/components/search/SearchButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusSelector } from '@/components/presence/StatusSelector';
import { useAuth } from '@/stores/auth';
import Image from 'next/image';
import { usePresenceSubscription } from '@/hooks/usePresenceSubscription';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { useEffect, useState } from 'react';

type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';

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
  members: Member[];
  channelId: string;
  className?: string;
}

export function ChannelSidebar({ members: initialMembers, channelId, className }: ChannelSidebarProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState(initialMembers);
  const supabase = createClientComponentClient<Database>();

  // Subscribe to presence changes
  useEffect(() => {
    const presenceChannel = supabase.channel('presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence'
        },
        () => {
          // Trigger presence subscription update
          setMembers(prev => [...prev]);
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
          // Trigger presence subscription update
          setMembers(prev => [...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(memberChannel);
    };
  }, [channelId, supabase]);

  // Use presence subscription hook for real-time updates
  const updatedMembers = usePresenceSubscription(members);

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
            Members ({updatedMembers.length})
          </h3>
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-4">
              {updatedMembers.map((member) => (
                <MemberListItem 
                  key={member.id}
                  member={member}
                  isCurrentUser={member.id === user?.id}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function MemberListItem({ member, isCurrentUser }: { member: Member; isCurrentUser: boolean }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-2",
        member.status === 'offline' && "opacity-50"
      )}
    >
      {isCurrentUser ? (
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
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs">{member.name[0]}</span>
        </div>
      )}
      <span className="text-sm font-medium">{member.name}</span>
    </div>
  );
} 