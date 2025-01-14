'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Hash, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateChannelModal } from '@/components/channels/create-channel-dialog';
import { useChannelSubscription } from '@/hooks/useChannelSubscription';

interface Channel {
  id: string;
  name: string;
  visibility: 'public' | 'private';
}

interface ChannelsSectionProps {
  channels: Channel[];
  selectedChannel?: string;
  currentGroupId?: string;
  currentGroupName?: string;
  onChannelSelect: (channelName: string) => void;
  userId: string;
}

export function ChannelsSection({
  channels,
  selectedChannel,
  currentGroupId,
  currentGroupName,
  onChannelSelect,
  userId
}: ChannelsSectionProps) {
  const router = useRouter();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = React.useState(false);

  // Subscribe to channel changes
  useChannelSubscription(currentGroupId, userId);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Channels
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-4 w-4 hover:scale-110 transition-transform"
          onClick={() => setIsCreateChannelOpen(true)}
          disabled={!currentGroupId}
          title={!currentGroupId ? "Select a group first" : "Create channel"}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-1">
        {channels.map((channel) => (
          <Button
            key={channel.id}
            variant="ghost"
            className={cn(
              "w-full justify-start transition-colors duration-200",
              selectedChannel === channel.name && "text-primary bg-muted/50"
            )}
            onClick={() => onChannelSelect(channel.name)}
          >
            <Hash className={cn(
              "h-4 w-4 mr-2 shrink-0",
              selectedChannel === channel.name && "text-primary"
            )} />
            <span className="truncate">{channel.name}</span>
            {channel.visibility === 'private' && (
              <Lock className="h-3 w-3 ml-1.5 text-muted-foreground shrink-0" />
            )}
          </Button>
        ))}
      </div>

      <CreateChannelModal 
        open={isCreateChannelOpen}
        onOpenChange={setIsCreateChannelOpen}
        onChannelCreated={() => {
          router.refresh();
        }}
        groupId={currentGroupId || ''}
        groupName={currentGroupName || ''}
      />
    </div>
  );
} 