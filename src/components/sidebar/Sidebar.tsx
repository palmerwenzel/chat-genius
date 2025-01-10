'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Hash, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreateChannelModal } from '@/components/channels/CreateChannelModal';
import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { Surface } from "../ui/surface";
import { SearchButton } from "@/components/search/SearchButton";

const supabase = createClientComponentClient<Database>();

interface Channel {
  id: string;
  name: string;
}

interface DirectMessage {
  id: string;
  name: string;
  avatar_url?: string;
  status?: 'online' | 'offline' | 'idle';
}

interface SidebarProps {
  channels?: Channel[];
  directMessages?: DirectMessage[];
  currentChannelName?: string;
}

export const Sidebar = ({ 
  channels = [], 
  directMessages = [],
  currentChannelName: initialChannelName
}: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(initialChannelName || pathname?.split('/')?.pop());

  // Update selected channel when URL changes
  useEffect(() => {
    const channelFromPath = pathname?.split('/')?.pop();
    setSelectedChannel(channelFromPath);
  }, [pathname]);

  const handleChannelClick = useCallback((channelName: string) => {
    // Immediately update UI
    setSelectedChannel(channelName);
    
    // Navigate to the channel
    router.push(`/chat/${channelName}`);
  }, [router]);

  useEffect(() => {
    const channel = supabase.channel('sidebar-channels')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'channels'
      }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [router]);

  return (
    <div className="w-[var(--sidebar-width-sm)] md:w-[var(--sidebar-width)] border-r backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <Link href="/chat">
            <h2 className="text-xl font-bold hover:text-primary transition-colors">Chat Genius</h2>
          </Link>
          <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <SearchButton 
            mode="channel" 
            placeholder="Search channels..."
          />
        </div>
      </div>
      <Surface>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-6">
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
                      selectedChannel === channel.name && "bg-muted font-semibold"
                    )}
                    onClick={() => handleChannelClick(channel.name)}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    {channel.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Direct Messages
                </h3>
                <Button variant="ghost" size="icon" className="h-4 w-4 hover:scale-110 transition-transform">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {directMessages.map((dm) => (
                  <Button
                    key={dm.id}
                    variant="ghost"
                    className="w-full justify-start hover:bg-muted transition-colors duration-200"
                    asChild
                  >
                    <Link href={`/chat/dm/${dm.id}`}>
                      <div className="relative mr-2">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={dm.avatar_url} />
                          <AvatarFallback>{dm.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${
                          dm.status === 'online' ? 'bg-success' :
                          dm.status === 'idle' ? 'bg-warning' :
                          'bg-muted'
                        }`} />
                      </div>
                      {dm.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </Surface>

      <CreateChannelModal 
        open={isCreateChannelOpen}
        onOpenChange={setIsCreateChannelOpen}
        onChannelCreated={() => {
          router.refresh();
        }}
      />
    </div>
  );
}; 