'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, Hash, Volume2 } from "lucide-react";
import { navigateToChannelByName } from '@/lib/client-navigation';
import type { Database } from '@/types/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { getChannels } from './actions';
import { Loader2 } from 'lucide-react';

type Channel = Database['public']['Tables']['channels']['Row'] & {
  unread_count?: number;
};

interface ChannelListClientProps {
  groupId: string;
  groupName: string;
  onCreateChannel?: () => void;
}

export function ChannelListClient({ groupId, groupName, onCreateChannel }: ChannelListClientProps) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  // Load channels
  useEffect(() => {
    async function loadChannels() {
      try {
        const result = await getChannels(groupId);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.channels) {
          setChannels(result.channels);
        }
      } catch (err) {
        console.error('Error loading channels:', err);
        setError('Failed to load channels');
      } finally {
        setIsLoading(false);
      }
    }

    loadChannels();
  }, [groupId]);

  // Subscribe to channel changes
  useEffect(() => {
    const channel = supabase.channel(`group-${groupId}-channels`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `group_id=eq.${groupId}`,
        },
        async () => {
          // Reload channels on any change
          const result = await getChannels(groupId);
          if (!result.error && result.channels) {
            setChannels(result.channels);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [groupId, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        {error}
      </div>
    );
  }

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
                <Button
                  key={channel.id}
                  variant="ghost"
                  className={"w-full justify-start " + (channel.unread_count ? "font-semibold" : "")}
                  onClick={() => handleChannelClick(channel.name)}
                >
                  {channel.type === 'text' ? <Hash className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                  {channel.name}
                  {channel.unread_count ? (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                  ) : null}
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