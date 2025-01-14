'use client';

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Shield, Crown, MoreVertical, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from "@/types/supabase";
import { getChannelMembers, addChannelMember, updateMemberRole, removeChannelMember } from './actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Member = Database['public']['Tables']['channel_members']['Row'] & {
  profiles: Database['public']['Tables']['users']['Row'];
};

interface MemberManagementClientProps {
  channelId: string;
  currentUserId: string;
}

export function MemberManagementClient({ channelId, currentUserId }: MemberManagementClientProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  // Load members
  useEffect(() => {
    async function loadMembers() {
      try {
        const result = await getChannelMembers(channelId);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.members) {
          setMembers(result.members);
        }
      } catch (err) {
        console.error('Error loading members:', err);
        setError('Failed to load members');
      } finally {
        setIsLoading(false);
      }
    }

    loadMembers();
  }, [channelId]);

  // Subscribe to member changes
  useEffect(() => {
    const channel = supabase.channel(`channel-${channelId}-members`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_members',
          filter: `channel_id=eq.${channelId}`,
        },
        async () => {
          // Reload members on any change
          const result = await getChannelMembers(channelId);
          if (!result.error && result.members) {
            setMembers(result.members);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, supabase]);

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

  const getRoleIcon = (role: Member['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleAddMember = async (userId: string) => {
    const result = await addChannelMember(channelId, userId);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: result.message,
    });
  };

  const handleUpdateRole = async (userId: string, role: 'member' | 'admin' | 'owner') => {
    const result = await updateMemberRole(channelId, userId, role);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: result.message,
    });
  };

  const handleRemoveMember = async (userId: string) => {
    const result = await removeChannelMember(channelId, userId);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: result.message,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <Button size="sm" variant="outline" onClick={() => handleAddMember("")}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>
      <Command>
        <CommandInput placeholder="Search members..." />
        <CommandEmpty>No members found.</CommandEmpty>
        <CommandGroup>
          <ScrollArea className="h-[300px]">
            {members.map((member) => (
              <CommandItem
                key={`${member.channel_id}-${member.user_id}`}
                className="flex items-center justify-between p-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={member.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(member.profiles.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.profiles.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.profiles.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  {member.user_id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.user_id, 'admin')}>
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.user_id, 'member')}>
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.user_id)}
                        >
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CommandItem>
            ))}
          </ScrollArea>
        </CommandGroup>
      </Command>
    </div>
  );
} 