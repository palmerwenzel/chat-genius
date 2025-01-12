import * as React from "react";
import { Smile, Trash, Pencil, Reply, GitMerge } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { ThreadSidebar } from "@/components/threads/ThreadSidebar";

interface MessageActionsProps {
  messageId: string;
  threadSize?: number;
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  children: React.ReactNode;
  isThreadOpen?: boolean;
  onThreadOpen?: () => void;
  onThreadClose?: () => void;
  onReply?: (replyTo: { id: string; content: string; author: string }) => void;
  onEdit?: () => void;
  channelId: string;
  threadId?: string;
  senderId: string;
  isThreadMessage?: boolean;
}

const commonEmojis = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "🚀", "✨"];

export function MessageActions({
  messageId,
  threadSize = 0,
  content,
  author,
  timestamp,
  children,
  isThreadOpen = false,
  onThreadOpen = () => {},
  onThreadClose = () => {},
  onReply,
  onEdit,
  channelId,
  threadId,
  senderId,
  isThreadMessage = false,
}: MessageActionsProps) {
  const { user } = useAuth();
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;

    const fetchUserRole = async () => {
      const { data: memberData } = await supabase
        .from('channel_members')
        .select('role')
        .eq('channel_id', channelId)
        .eq('user_id', user.id)
        .single();

      if (memberData) {
        setUserRole(memberData.role);
      }
    };

    fetchUserRole();
  }, [user, channelId]);

  const canDeleteMessage = React.useMemo(() => {
    if (!user) return false;
    if (senderId === user.id) return true;
    if (userRole === 'owner' || userRole === 'admin') return true;
    return false;
  }, [user, senderId, userRole]);

  const handleReaction = React.useCallback(async (emoji: string) => {
    if (!user) return;
    
    try {
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existingReaction) {
        // Remove reaction if it exists
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add new reaction
        await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Results contain 0 rows')) {
        // No existing reaction, add new one
        await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
      } else {
        console.error('Error toggling reaction:', error);
      }
    }
  }, [messageId, user]);

  const handleCreateThread = React.useCallback(async () => {
    if (!user) return;
    
    try {
      // First, update any existing replies to be part of this thread
      const { error: updateRepliesError } = await supabase
        .from('messages')
        .update({ thread_id: messageId })
        .eq('replying_to_id', messageId);

      if (updateRepliesError) throw updateRepliesError;

      // Open the thread view immediately
      onThreadOpen();
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  }, [user, onThreadOpen, messageId]);

  const handleDelete = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          deleted_at: new Date().toISOString(),
          // Optionally clear the content for privacy
          content: '[Message deleted]'
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, [messageId, user]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuSub>
            <ContextMenuSubTrigger className="cursor-pointer">
              <Smile className="h-4 w-4 mr-2" />
              Add Reaction
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="p-2">
              <ScrollArea className="h-32">
                <div className="grid grid-cols-8 gap-1">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      className="h-6 w-6 hover:bg-muted rounded flex items-center justify-center"
                      onClick={async () => {
                        await handleReaction(emoji);
                        document.dispatchEvent(
                          new KeyboardEvent('keydown', {
                            key: 'Escape',
                            bubbles: true,
                            cancelable: true
                          })
                        );
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem 
            onClick={() => onReply?.({ id: messageId, content, author: author.name })}
            className="cursor-pointer group"
          >
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </ContextMenuItem>

          {!threadId && !isThreadMessage && (
            <ContextMenuItem 
              onClick={handleCreateThread}
              className="cursor-pointer group"
            >
              <GitMerge className="h-4 w-4 mr-2 text-primary/70 group-hover:text-primary transition-colors" />
              {threadSize > 0 ? `View Thread (${threadSize})` : 'Create Thread'}
            </ContextMenuItem>
          )}

          {(senderId === user?.id || canDeleteMessage) && (
            <>
              <ContextMenuSeparator />
              
              {senderId === user?.id && (
                <ContextMenuItem 
                  onClick={onEdit}
                  className="cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Message
                </ContextMenuItem>
              )}
              
              {canDeleteMessage && (
                <ContextMenuItem 
                  onClick={handleDelete}
                  className="text-red-400 cursor-pointer"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Message
                </ContextMenuItem>
              )}
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {isThreadOpen && !isThreadMessage && (
        <ThreadSidebar
          isOpen={isThreadOpen}
          onClose={onThreadClose}
          threadId={messageId}
          channelId={channelId}
          parentMessage={{
            id: messageId,
            content,
            author,
            timestamp
          }}
        />
      )}
    </>
  );
} 