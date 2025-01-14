"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageContent } from '@/components/messages/message-content';
import { MessageActions } from '@/components/messages/message-actions';
import { LinkPreview } from '@/components/messages/link-preview';
import { EmojiReactions } from '@/components/messages/emoji-reactions';
import { ParentMessagePreview } from '@/components/messages/parent-message-preview';
import { Reply } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useChatContext } from '@/contexts/chat';
import { MessageInput } from '@/components/messages/message-input';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from "@/types/supabase";

const supabase = createClientComponentClient<Database>();

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
  thread_id?: string;
  replying_to_id?: string;
  metadata?: {
    files?: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
    }>;
  };
};

interface MessageClientProps {
  message: MessageType;
  parentMessage: MessageType | null;
  initialThreadSize: number;
  initialReactions: Array<{ emoji: string; count: number; users: string[] }>;
  isBeingRepliedTo?: boolean;
  isThreadMessage?: boolean;
}

interface ReactionType {
  emoji: string;
  count: number;
  users: string[];
}

export function MessageClient({
  message,
  parentMessage: initialParentMessage,
  initialThreadSize,
  initialReactions,
  isBeingRepliedTo,
  isThreadMessage
}: MessageClientProps) {
  const { setReplyTo } = useChatContext();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [threadSize, setThreadSize] = React.useState(initialThreadSize);
  const [isThreadOpen, setIsThreadOpen] = React.useState(false);
  const [reactions, setReactions] = React.useState<ReactionType[]>(initialReactions);
  const [parentMessage, setParentMessage] = React.useState(initialParentMessage);
  const messageInputRef = React.useRef<{ focus: () => void }>(null);
  const urls = message.content.match(/https?:\/\/[^\s]+/g) || [];

  // Subscribe to thread count changes
  React.useEffect(() => {
    const channel = supabase
      .channel(`message-thread-${message.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${message.id}`
      }, async () => {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', message.id);

        if (count !== null) {
          setThreadSize(count);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [message.id]);

  // Subscribe to parent message changes
  React.useEffect(() => {
    if (!message.replying_to_id) return;

    const channel = supabase
      .channel(`parent-message-${message.replying_to_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `id=eq.${message.replying_to_id}`
      }, async (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          setParentMessage(prev => prev ? { ...prev, ...payload.new } : null);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [message.replying_to_id]);

  // Subscribe to reaction changes
  React.useEffect(() => {
    const channel = supabase
      .channel(`message-reactions-${message.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `message_id=eq.${message.id}`
      }, async () => {
        const { data: dbReactions } = await supabase
          .from('reactions')
          .select('*')
          .eq('message_id', message.id);

        if (dbReactions) {
          // Group reactions by emoji
          const groupedReactions = dbReactions.reduce((acc: ReactionType[], reaction) => {
            const existing = acc.find(r => r.emoji === reaction.emoji);
            if (existing) {
              existing.users.push(reaction.user_id);
              existing.count++;
            } else {
              acc.push({
                emoji: reaction.emoji,
                count: 1,
                users: [reaction.user_id]
              });
            }
            return acc;
          }, []);

          setReactions(groupedReactions);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [message.id]);

  const handleReaction = React.useCallback(async (emoji: string) => {
    if (!user) return;
    
    try {
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', message.id)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existingReaction) {
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        await supabase
          .from('reactions')
          .insert({
            message_id: message.id,
            user_id: user.id,
            emoji,
          });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }, [message.id, user]);

  const handleThreadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsThreadOpen(true);
  };

  const handleReply = () => {
    setReplyTo({
      id: message.id,
      content: message.content,
      author: message.sender.name
    });
  };

  return (
    <MessageActions
      messageId={message.id}
      threadSize={threadSize}
      content={message.content}
      author={{
        name: message.sender.name,
        avatar: message.sender.avatar_url || undefined
      }}
      timestamp={message.created_at}
      isThreadOpen={isThreadOpen}
      onThreadOpen={() => setIsThreadOpen(true)}
      onThreadClose={() => setIsThreadOpen(false)}
      onEdit={() => setIsEditing(true)}
      onReply={handleReply}
      threadId={message.thread_id}
      senderId={message.sender_id}
      channelId={message.channel_id}
      isThreadMessage={isThreadMessage}
    >
      <div className="flex flex-col gap-1">
        {parentMessage && (
          <ParentMessagePreview
            content={parentMessage.content}
            author={{
              name: parentMessage.sender.name,
              avatar: parentMessage.sender.avatar_url || undefined
            }}
            timestamp={parentMessage.created_at}
            deleted={!!parentMessage.deleted_at}
          />
        )}
        <div className={`
          group flex items-start space-x-4 animate-fade-in rounded-lg
          ${isBeingRepliedTo ? 'bg-amber-50/10 -mx-4 px-4 py-2 border-l-2 border-amber-400' : ''}
        `}>
          <Avatar className="cursor-pointer transition-transform hover:scale-105">
            <AvatarImage src={message.sender.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{message.sender.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-sm max-w-[80%]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-md font-medium">{message.sender.name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString()}
              </span>
              {threadSize > 0 && (
                <button
                  onClick={handleThreadClick}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group/thread"
                >
                  <Reply className="h-3 w-3 text-amber-400 group-hover/thread:text-amber-500 transition-colors" />
                  {threadSize} thread replies
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="w-full">
                <MessageInput
                  ref={messageInputRef}
                  channelId={message.channel_id}
                  placeholder="Edit your message..."
                  disabled={false}
                />
              </div>
            ) : (
              <>
                <div className={`
                  rounded-lg w-fit
                  ${message.type === 'text' ? 'bg-secondary/70 text-foreground p-3' : ''}
                `}>
                  <MessageContent 
                    content={message.content} 
                    type={message.type || 'text'}
                    metadata={message.metadata}
                  />
                </div>

                {/* Link Previews */}
                {urls.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {urls.map((url) => (
                      <LinkPreview key={url} url={url} />
                    ))}
                  </div>
                )}

                {/* Emoji Reactions */}
                {reactions.length > 0 && (
                  <EmojiReactions
                    reactions={reactions}
                    currentUserId={user?.id || ''}
                    onReact={handleReaction}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MessageActions>
  );
}
