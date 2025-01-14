import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { UserPlus, Shield, Crown, MoreVertical, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { useEffect, useState } from "react";
import { Database } from "@/types/supabase";

type Member = Database['public']['Tables']['channel_members']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'];
};

interface MemberManagementProps {
  channelId: string;
  currentUserId: string;
}

export function MemberManagement({ channelId, currentUserId }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        const { data, error } = await supabase
          .from('channel_members')
          .select(`
            *,
            profile:profiles (*)
          `)
          .eq('channel_id', channelId);

        if (error) throw error;
        setMembers(data as Member[]);
      } catch (err) {
        console.error('Error loading members:', err);
        setError(err instanceof Error ? err.message : 'Failed to load members');
      } finally {
        setIsLoading(false);
      }
    }

    loadMembers();
  }, [channelId]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>
      <Separator />
      <Command>
        <CommandInput placeholder="Search members..." />
        <CommandEmpty>No members found.</CommandEmpty>
        <CommandGroup>
          <ScrollArea className="h-[300px]">
            {members.map((member) => (
              <CommandItem
                key={member.id}
                className="flex items-center justify-between p-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={member.profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(member.profile.full_name || member.profile.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.profile.full_name || member.profile.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{member.profile.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  {member.user_id !== currentUserId && (
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
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