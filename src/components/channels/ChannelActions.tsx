import * as React from "react";
import { Pencil, Lock, Unlock, Trash } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useAuth } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ChannelActionsProps {
  channelId: string;
  isPrivate?: boolean;
  children: React.ReactNode;
  onContextMenuChange?: (open: boolean) => void;
}

export function ChannelActions({
  channelId,
  isPrivate,
  children,
  onContextMenuChange,
}: ChannelActionsProps) {
  const { user } = useAuth();
  const [isCreator, setIsCreator] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    const checkCreator = async () => {
      const { data: channel } = await supabase
        .from('channels')
        .select('created_by')
        .eq('id', channelId)
        .single();

      setIsCreator(channel?.created_by === user.id);
    };

    checkCreator();
  }, [user, channelId]);

  const handleVisibilityToggle = React.useCallback(async () => {
    if (!user || !isCreator) return;
    
    try {
      const { error } = await supabase
        .from('channels')
        .update({ 
          visibility: isPrivate ? 'public' : 'private'
        })
        .eq('id', channelId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating channel visibility:', error);
    }
  }, [channelId, isPrivate, user, isCreator]);

  const handleDelete = React.useCallback(async () => {
    if (!user || !isCreator) return;
    
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  }, [channelId, user, isCreator]);

  return (
    <ContextMenu onOpenChange={onContextMenuChange}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 min-h-[32px] py-1">
        <ContextMenuItem 
          className={cn(
            "flex items-center px-2 py-1.5 focus:bg-accent focus:text-accent-foreground",
            isCreator ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
          disabled={!isCreator}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Name
        </ContextMenuItem>

        <ContextMenuItem 
          onClick={handleVisibilityToggle}
          className={cn(
            "flex items-center px-2 py-1.5 focus:bg-accent focus:text-accent-foreground",
            isCreator ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
          disabled={!isCreator}
        >
          {isPrivate ? (
            <>
              <Unlock className="h-4 w-4 mr-2" />
              Make Public
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Make Private
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={handleDelete}
          className={cn(
            "flex items-center px-2 py-1.5 focus:bg-accent focus:text-accent-foreground text-red-400 focus:text-red-400",
            isCreator ? "cursor-pointer" : "cursor-not-allowed opacity-50"
          )}
          disabled={!isCreator}
        >
          <Trash className="h-4 w-4 mr-2" />
          Delete Channel
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 