'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Hash, Plus, Settings, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreateChannelModal } from '@/components/channels/CreateChannelModal';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { Surface } from "../ui/surface";
import { UserMenu } from "@/components/user/UserMenu";
import { toast } from "@/components/ui/use-toast";
import { navigateToChannelByName } from '@/lib/client-navigation';
import { GroupActions } from '@/components/groups/GroupActions';
import { ChannelActions } from '@/components/channels/ChannelActions';
import { JoinGroupDialog } from "@/components/groups/JoinGroupDialog";

const supabase = createClientComponentClient<Database>();

interface Channel {
  id: string;
  name: string;
  visibility: 'public' | 'private';
}

interface DirectMessage {
  id: string;
  name: string;
  avatar_url?: string;
  status?: 'online' | 'offline' | 'idle';
}

interface Group {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  role: 'owner' | 'admin' | 'member' | 'none';
  visibility: 'public' | 'private';
}

interface SidebarProps {
  channels?: Channel[];
  directMessages?: DirectMessage[];
  currentChannelName?: string;
}

export const Sidebar = ({ 
  directMessages = [],
  currentChannelName: initialChannelName
}: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(initialChannelName || pathname?.split('/')?.pop());
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Extract current group from URL
  const currentGroupName = pathname?.split('/')?.[2];
  const currentGroup = groups.find(g => g.name === currentGroupName);

  // Function to load channels (moved outside useEffect to be reusable)
  const loadChannels = useCallback(async () => {
    if (!currentGroup?.id) {
      setChannels([]);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get both member channels and public channels
      const [memberResponse, publicResponse] = await Promise.all([
        // Get channels where user is a member
        supabase
          .from('channels')
          .select(`
            id,
            name,
            visibility,
            channel_members!inner (
              user_id
            )
          `)
          .eq('group_id', currentGroup.id)
          .eq('channel_members.user_id', session.user.id),
        
        // Get public channels
        supabase
          .from('channels')
          .select(`
            id,
            name,
            visibility
          `)
          .eq('group_id', currentGroup.id)
          .eq('visibility', 'public')
      ]);

      if (memberResponse.error) throw memberResponse.error;
      if (publicResponse.error) throw publicResponse.error;

      // Combine and deduplicate channels
      const allChannels = [...(memberResponse.data || [])].map(channel => ({
        id: channel.id,
        name: channel.name,
        visibility: channel.visibility
      }));
      
      (publicResponse.data || []).forEach(publicChannel => {
        if (!allChannels.some(c => c.id === publicChannel.id)) {
          allChannels.push(publicChannel);
        }
      });

      // Sort by name
      allChannels.sort((a, b) => a.name.localeCompare(b.name));

      setChannels(allChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load channels. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentGroup?.id]);

  // Subscribe to channel changes
  useEffect(() => {
    if (!currentGroup?.id) return;

    loadChannels();

    const channel = supabase
      .channel(`group-${currentGroup.id}-channels`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `group_id=eq.${currentGroup.id}`,
        },
        () => {
          loadChannels();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentGroup?.id, loadChannels]);

  useEffect(() => {
    async function loadGroups() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get both member groups and public groups
      const [{ data: memberGroups }, { data: publicGroups }] = await Promise.all([
        // Get groups where user is a member
        supabase
          .from('groups')
          .select(`
            id,
            name,
            display_name,
            description,
            visibility,
            group_members!inner (
              role,
              user_id
            )
          `)
          .eq('group_members.user_id', session.user.id),
        
        // Get public groups
        supabase
          .from('groups')
          .select(`
            id,
            name,
            display_name,
            description,
            visibility,
            group_members!left (
              role,
              user_id
            )
          `)
          .eq('visibility', 'public')
      ]);

      if (!memberGroups || !publicGroups) {
        console.error('Error loading groups');
        return;
      }

      // Combine and deduplicate groups
      const allGroups = [...memberGroups];
      publicGroups.forEach(publicGroup => {
        if (!allGroups.some(g => g.id === publicGroup.id)) {
          allGroups.push(publicGroup);
        }
      });

      // Sort by name
      allGroups.sort((a, b) => a.name.localeCompare(b.name));

      setGroups(allGroups.map(group => {
        const membership = group.group_members?.find(m => m.user_id === session.user.id);
        return {
          id: group.id,
          name: group.name,
          display_name: group.display_name,
          description: group.description || undefined,
          role: membership?.role || 'none',
          visibility: group.visibility
        };
      }));
    }

    loadGroups();

    // Subscribe to relevant group changes for this user
    let channel: ReturnType<typeof supabase.channel>;
    
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      channel = supabase.channel('group-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: 'visibility=eq.public'
        }, () => {
          loadGroups();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: session?.user ? `user_id=eq.${session.user.id}` : undefined
        }, () => {
          loadGroups();
        })
        .subscribe();
    })();

    return () => {
      channel?.unsubscribe();
    };
  }, []);

  // Update selected channel when URL changes
  useEffect(() => {
    const channelFromPath = pathname?.split('/')?.pop();
    setSelectedChannel(channelFromPath);
  }, [pathname]);

  const handleChannelClick = useCallback(async (channelName: string) => {
    // Immediately update UI
    setSelectedChannel(channelName);
    
    // Navigate to the channel using our navigation helper
    if (currentGroupName) {
      await navigateToChannelByName(currentGroupName, channelName, router);
    }
  }, [router, currentGroupName]);

  return (
    <div className="w-[var(--sidebar-width-sm)] md:w-[var(--sidebar-width)] border-r backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-screen">
      <div className="p-4 border-b shrink-0">
        <div className="flex items-center justify-between">
          <Link href="/chat">
            <h2 className="text-xl font-bold hover:text-primary transition-colors">Chat Genius</h2>
          </Link>
          <Button variant="ghost" size="icon" className="hover:scale-110 transition-transform">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        {/*
        <div className="mt-4">
          <SearchButton 
            mode="channel" 
            placeholder="Search channels..."
          />
        </div>
        */}
      </div>
      <Surface className="flex-1 min-h-0">
        <div className="flex h-full relative">
          {/* Groups Section */}
          <div 
            className={cn(
              "absolute top-0 left-0 h-full border-r transition-all duration-300 ease-in-out z-10 flex flex-col",
              isGroupsExpanded || isGroupMenuOpen
                ? "backdrop-blur-md bg-background/80 supports-[backdrop-filter]:bg-background/60" 
                : "bg-background",
              isGroupsExpanded || isGroupMenuOpen ? "w-[320px]" : "w-[72px]"
            )}
            onMouseEnter={() => setIsGroupsExpanded(true)}
            onMouseLeave={() => !isGroupMenuOpen && setIsGroupsExpanded(false)}
          >
            <ScrollArea className="flex-1">
              <div className="p-2 pl-4 space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="relative">
                    {currentGroupName === group.name && (
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md" />
                    )}
                    <GroupActions
                      groupId={group.id}
                      isPrivate={group.visibility === 'private'}
                      onContextMenuChange={setIsGroupMenuOpen}
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            "w-full transition-all duration-200 hover:bg-muted/30 rounded-md text-sm cursor-pointer",
                            (isGroupsExpanded || isGroupMenuOpen) ? "justify-start px-4" : "justify-center p-0",
                            currentGroupName === group.name && "text-primary",
                            group.role === 'none' && "opacity-75"
                          )}
                          onClick={() => {
                            if (group.role === 'none') {
                              // Show join group dialog
                              setShowJoinDialog(true);
                              setSelectedGroup(group);
                              return;
                            }
                            router.push(`/chat/${group.name}`);
                          }}
                        >
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 transition-all">
                              <AvatarFallback>
                                {group.display_name[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div 
                              className={cn(
                                "ml-3 transition-all duration-300 min-w-0 text-left flex items-center gap-1.5",
                                (isGroupsExpanded || isGroupMenuOpen) ? "opacity-100 flex-1" : "opacity-0 w-0"
                              )}
                            >
                              <span className="truncate">{group.display_name}</span>
                              {group.role !== 'none' && group.role !== 'member' && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  ({group.role})
                                </span>
                              )}
                              {group.role === 'none' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowJoinDialog(true);
                                    setSelectedGroup(group);
                                  }}
                                >
                                  Join
                                </Button>
                              )}
                              {group.visibility === 'private' && (
                                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </GroupActions>
                  </div>
                ))}

                <Button
                  variant="ghost"
                  className={cn(
                    "w-full transition-all duration-200 hover:bg-muted/30",
                    isGroupsExpanded ? "justify-start px-4" : "justify-center p-0"
                  )}
                  onClick={() => setIsCreateGroupOpen(true)}
                >
                  <Avatar className="h-10 w-10 transition-all bg-muted">
                    <AvatarFallback>
                      <Plus className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={cn(
                      "ml-3 transition-all duration-300 text-left",
                      isGroupsExpanded ? "opacity-100" : "opacity-0 w-0"
                    )}
                  >
                    Create Group
                  </div>
                </Button>
              </div>
            </ScrollArea>

            <div className="p-2 border-t shrink-0">
              <UserMenu expanded={isGroupsExpanded} />
            </div>
          </div>

          {/* Channels Section */}
          <div className="flex-1 pl-[72px]">
            <ScrollArea className="h-full">
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
                      disabled={!currentGroup}
                      title={!currentGroup ? "Select a group first" : "Create channel"}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {channels.map((channel) => (
                      <ChannelActions
                        key={channel.id}
                        channelId={channel.id}
                        isPrivate={channel.visibility === 'private'}
                      >
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start transition-colors duration-200",
                            selectedChannel === channel.name && "text-primary bg-muted/50"
                          )}
                          onClick={() => handleChannelClick(channel.name)}
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
                      </ChannelActions>
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
          </div>
        </div>
      </Surface>

      <CreateChannelModal 
        open={isCreateChannelOpen}
        onOpenChange={setIsCreateChannelOpen}
        onChannelCreated={() => {
          router.refresh();
        }}
        groupId={currentGroup?.id || ''}
        groupName={currentGroupName || ''}
      />

      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onGroupCreated={() => {
          router.refresh();
        }}
      />

      <JoinGroupDialog
        group={selectedGroup}
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
      />
    </div>
  );
}; 