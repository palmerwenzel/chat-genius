'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { navigateToChannelByName, navigateToGroup } from '@/lib/client-navigation';
import { getFirstAvailableChannel } from './actions';
import { useGroupSubscription } from '@/hooks/useGroupSubscription';

interface Group {
  id: string;
  name: string;
  description?: string;
  role: 'owner' | 'admin' | 'member' | 'none';
  visibility: 'public' | 'private';
}

interface GroupsSectionProps {
  groups: Group[];
  currentGroupName?: string;
  userId: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function GroupsSection({ 
  groups, 
  currentGroupName, 
  userId,
  expanded,
  onExpandedChange
}: GroupsSectionProps) {
  const router = useRouter();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);

  // Subscribe to group changes
  useGroupSubscription(userId);

  return (
    <div 
      className={cn(
        "absolute top-0 left-0 h-full border-r transition-all duration-300 ease-in-out z-10 flex flex-col",
        expanded 
          ? "backdrop-blur-md bg-background/80 supports-[backdrop-filter]:bg-background/60" 
          : "bg-background",
        expanded ? "w-[320px]" : "w-[72px]"
      )}
      onMouseEnter={() => onExpandedChange(true)}
      onMouseLeave={() => onExpandedChange(false)}
    >
      <ScrollArea className="flex-1">
        <div className="p-2 pl-4 space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="relative">
              {currentGroupName === group.name && (
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md" />
              )}
              <Button
                variant="ghost"
                className={cn(
                  "w-full transition-all duration-200 hover:bg-muted/30",
                  expanded ? "justify-start px-4" : "justify-center p-0",
                  currentGroupName === group.name && "text-primary",
                  group.role === 'none' && "opacity-75"
                )}
                onClick={async () => {
                  if (currentGroupName === group.name) return;

                  try {
                    const { channelName } = await getFirstAvailableChannel(group.id, userId);
                    
                    // Navigate to first available channel or group page
                    if (channelName) {
                      await navigateToChannelByName(group.name, channelName, router);
                    } else {
                      await navigateToGroup(group.name, router);
                    }
                  } catch (error) {
                    console.error('Error navigating to group:', error);
                  }
                }}
              >
                <Avatar className="h-10 w-10 transition-all">
                  <AvatarFallback>
                    {group.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className={cn(
                    "ml-3 transition-all duration-300 min-w-0 text-left flex items-center gap-1.5",
                    expanded ? "opacity-100 flex-1" : "opacity-0 w-0"
                  )}
                >
                  <span className="truncate">{group.name}</span>
                  {group.role !== 'none' && group.role !== 'member' && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({group.role})
                    </span>
                  )}
                  {group.visibility === 'private' && (
                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </div>
              </Button>
            </div>
          ))}

          <Button
            variant="ghost"
            className={cn(
              "w-full transition-all duration-200 hover:bg-muted/30",
              expanded ? "justify-start px-4" : "justify-center p-0"
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
                expanded ? "opacity-100" : "opacity-0 w-0"
              )}
            >
              Create Group
            </div>
          </Button>
        </div>
      </ScrollArea>

      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onGroupCreated={() => {
          router.refresh();
        }}
      />
    </div>
  );
} 