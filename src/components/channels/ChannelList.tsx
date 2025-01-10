import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusIcon } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  unread?: boolean;
  category?: string;
}

// Placeholder data
const channels: Channel[] = [
  { id: '1', name: 'general', type: 'text', category: 'General' },
  { id: '2', name: 'random', type: 'text', category: 'General' },
  { id: '3', name: 'development', type: 'text', category: 'Work', unread: true },
  { id: '4', name: 'design', type: 'text', category: 'Work' },
  { id: '5', name: 'voice-chat', type: 'voice', category: 'Voice' },
];

export function ChannelList() {
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
    // Use router.push for instant client-side navigation
    router.push(`/chat/${channelName}`);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        <Button variant="outline" className="w-full justify-start mb-4">
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
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={"w-full justify-start " + (channel.unread ? "font-semibold" : "")}
                  onClick={() => handleChannelClick(channel.name)}
                  // Add prefetch on hover
                  onMouseEnter={() => {
                    router.prefetch(`/chat/${channel.name}`);
                  }}
                >
                  {channel.type === 'text' ? '#' : '🔊'}{' '}
                  {channel.name}
                  {channel.unread && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              ))}
            </div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 