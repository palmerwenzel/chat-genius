import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusIcon } from "lucide-react";
import { navigateToChannelByName } from '@/lib/client-navigation';
import { ChannelActions } from './ChannelActions';

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  unread?: boolean;
  category?: string;
  topic?: string;
  visibility?: 'public' | 'private';
  group_id: string;
}

interface ChannelListProps {
  groupName: string;
  channels: Channel[];
  onCreateChannel?: () => void;
}

export function ChannelList({ groupName, channels, onCreateChannel }: ChannelListProps) {
  const router = useRouter();

  // Group channels by category
  const channelsByCategory = channels.reduce((acc, channel) => {
    const category = channel.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  const handleChannelClick = async (channelName: string) => {
    await navigateToChannelByName(groupName, channelName, router);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        <Button 
          variant="outline" 
          className="w-full justify-start mb-4"
          onClick={onCreateChannel}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Channel
        </Button>
        
        {Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
          <div key={category} className="mb-4">
            <h4 className="px-2 mb-2 text-sm font-semibold text-muted-foreground">
              {category}
            </h4>
            <div className="space-y-1">
              {categoryChannels.map((channel) => (
                <ChannelActions
                  key={channel.id}
                  channelId={channel.id}
                  name={channel.name}
                  topic={channel.topic}
                  isPrivate={channel.visibility === 'private'}
                >
                  <div className="relative" onContextMenu={(e) => {
                    console.log('ChannelList: Right-click on wrapper div:', e);
                  }}>
                    <Button
                      variant="ghost"
                      className={"w-full justify-start " + (channel.unread ? "font-semibold" : "")}
                      onClick={() => handleChannelClick(channel.name)}
                      onContextMenu={(e) => {
                        console.log('ChannelList: Right-click on button:', e);
                      }}
                    >
                      {channel.type === 'text' ? '#' : '🔊'}{' '}
                      {channel.name}
                      {channel.unread && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                      )}
                    </Button>
                  </div>
                </ChannelActions>
              ))}
            </div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 