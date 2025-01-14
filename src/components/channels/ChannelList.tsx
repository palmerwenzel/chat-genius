import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Hash, PlusIcon, Volume2 } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  unread?: boolean;
  category?: string;
}

interface ChannelListProps {
  channels: Channel[];
  onCreateChannel?: () => void;
}

export function ChannelList({ channels, onCreateChannel }: ChannelListProps) {
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

  const handleChannelClick = (channelName: string) => {
    router.push(`/chat/${channelName}`);
  };

  const hasChannels = channels.length > 0;

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
        
        {!hasChannels ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No channels available.
            <br />
            Create a channel to get started!
          </div>
        ) : (
          Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
            <div key={category} className="mb-4">
              <h4 className="px-2 mb-2 text-sm font-semibold text-muted-foreground">
                {category}
              </h4>
              <div className="space-y-1">
                {categoryChannels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className={"w-full justify-start " + (channel.unread ? "font-semibold" : "")}
                    onClick={() => handleChannelClick(channel.name)}
                    onMouseEnter={() => {
                      router.prefetch(`/chat/${channel.name}`);
                    }}
                  >
                    {channel.type === 'text' ? <Hash className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                    {channel.name}
                    {channel.unread && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                ))}
              </div>
              <Separator className="my-2" />
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
} 