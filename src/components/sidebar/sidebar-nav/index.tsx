import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Surface } from '@/components/ui/surface';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserMenuClient } from '@/components/user/user-menu/client';
import { getInitialData, getGroupChannels } from './actions';
import { GroupsSection } from './groups-section';
import { ChannelsSection } from './channels-section';
import { DirectMessagesSection } from './direct-messages-section';

interface SidebarNavProps {
  userId: string;
  currentGroupName?: string;
  currentChannelName?: string;
  directMessages?: Array<{
    id: string;
    name: string;
    avatar_url?: string;
    status?: 'online' | 'offline' | 'idle';
  }>;
}

export async function SidebarNav({ 
  userId,
  currentGroupName,
  currentChannelName,
  directMessages = []
}: SidebarNavProps) {
  // Get initial data
  const { groups } = await getInitialData(userId);
  
  // Get current group's channels if a group is selected
  const currentGroup = groups.find(g => g.name === currentGroupName);
  const { channels = [] } = currentGroup 
    ? await getGroupChannels(currentGroup.id, userId)
    : { channels: [] };

  return (
    <div className="w-[var(--sidebar-width-sm)] md:w-[var(--sidebar-width)] border-r backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <Link href="/chat">
            <h2 className="text-xl font-bold hover:text-primary transition-colors">Chat Genius</h2>
          </Link>
          <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Surface className="flex-1 min-h-0">
        <div className="flex h-full relative">
          {/* Groups */}
          <GroupsSection
            groups={groups}
            currentGroupName={currentGroupName}
            userId={userId}
            expanded={false}
            onExpandedChange={() => {}}
          />

          {/* Channels and DMs */}
          <div className="flex-1 pl-[72px]">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {/* Channels */}
                <ChannelsSection
                  channels={channels}
                  selectedChannel={currentChannelName}
                  currentGroupId={currentGroup?.id}
                  currentGroupName={currentGroupName}
                  onChannelSelect={() => {}}
                  userId={userId}
                />

                {/* Direct Messages */}
                <DirectMessagesSection
                  directMessages={directMessages}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      </Surface>

      {/* User Menu */}
      <div className="p-2 border-t shrink-0">
        <UserMenuClient expanded={false} />
      </div>
    </div>
  );
} 