'use client';

import { SearchButton } from '@/components/search/SearchButton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

type Member = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status?: 'online' | 'offline' | 'idle' | 'dnd';
};

interface ChannelSidebarProps {
  channelId: string;
  className?: string;
}

export function ChannelSidebar({ channelId, className }: ChannelSidebarProps) {
  // TODO: Replace with real data from Supabase Presence
  const members: Member[] = [
    { id: '1', name: 'Alice Johnson', status: 'online', email: '', avatar_url: null },
    { id: '2', name: 'Bob Smith', status: 'idle', email: '', avatar_url: null },
    { id: '3', name: 'Carol White', status: 'offline', email: '', avatar_url: null },
    { id: '4', name: 'David Brown', status: 'dnd', email: '', avatar_url: null },
  ];

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
                <div key={member.id} className="flex items-center gap-2">
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
                    <span className="text-sm">{member.name}</span>
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