'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageContent } from '@/components/messages/MessageContent';
import { MessageActions } from '@/components/messages/MessageActions';
import { LinkPreview } from '@/components/messages/LinkPreview';
import { EmojiReactions } from '@/components/messages/EmojiReactions';
import { ParentMessagePreview } from '@/components/messages/ParentMessagePreview';
import { Reply } from 'lucide-react';
import { Database } from '@/types/supabase';
import { useAuth } from '@/stores/auth';
import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useChatContext } from '@/contexts/chat';
import { MessageInput } from '@/components/messages/MessageInput';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

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
    is_bot?: boolean;
    bot_number?: number;
    is_summary?: boolean;
    bot_type?: string;
  };
};

interface MessageProps {
  message: MessageType;
  isBeingRepliedTo?: boolean;
  onScrollToMessage?: (messageId: string) => void;
  onReply?: (message: MessageType) => void;
  isThreadMessage?: boolean;
}

export function Message({ message, isBeingRepliedTo, onScrollToMessage, onReply, isThreadMessage }: MessageProps) {
  const { setReplyTo } = useChatContext();
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [threadSize, setThreadSize] = useState(0);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [parentMessage, setParentMessage] = useState<MessageType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const urls = message.content.match(/https?:\/\/[^\s]+/g) || [];
  const supabase = createClientComponentClient<Database>();

  // Handle message update
  const handleUpdateMessage = async (content: string, type: 'text' | 'code' = 'text') => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content, type })
        .eq('id', message.id)
        .eq('sender_id', user?.id); // Ensure only the sender can edit

      if (error) throw error;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  // Load thread count
  useEffect(() => {
    let mounted = true;

    const loadThreadSize = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('thread_id', message.id);

      if (mounted && count !== null) {
        setThreadSize(count);
      }
    };

    loadThreadSize();

    // Subscribe to thread count changes
    const subscription = supabase
      .channel(`message-thread-${message.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${message.id}`
      }, async () => {
        // Reload count on any changes
        loadThreadSize();
      })
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [message.id]);

  // Load parent message if this is a reply
  useEffect(() => {
    let mounted = true;

    const loadParentMessage = async () => {
      if (!message.replying_to_id) return;

      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(
            id,
            name,
            avatar_url,
            email
          )
        `)
        .eq('id', message.replying_to_id)
        .single();

      if (mounted && data) {
        setParentMessage(data as MessageType);
      }
    };

    loadParentMessage();

    // Subscribe to parent message changes
    const subscription = supabase
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
      mounted = false;
      subscription.unsubscribe();
    };
  }, [message.replying_to_id]);

  // Handle reaction toggle
  const handleReaction = useCallback(async (emoji: string) => {
    if (!user) return;
    
    try {
      console.log('Checking for existing reaction:', { emoji, messageId: message.id, userId: user.id });
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', message.id)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existingReaction) {
        console.log('Removing existing reaction:', existingReaction);
        // Remove reaction if it exists
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);

        // Immediately update local state
        setReactions(prev => {
          return prev.map(reaction => {
            if (reaction.emoji === emoji) {
              const users = reaction.users.filter(id => id !== user.id);
              return {
                ...reaction,
                users,
                count: users.length
              };
            }
            return reaction;
          }).filter(reaction => reaction.count > 0);
        });
      } else {
        console.log('Adding new reaction');
        // Add new reaction
        await supabase
          .from('reactions')
          .insert({
            message_id: message.id,
            user_id: user.id,
            emoji,
          });

        // Immediately update local state
        setReactions(prev => {
          const existing = prev.find(r => r.emoji === emoji);
          if (existing) {
            return prev.map(reaction => {
              if (reaction.emoji === emoji && !reaction.users.includes(user.id)) {
                return {
                  ...reaction,
                  users: [...reaction.users, user.id],
                  count: reaction.count + 1
                };
              }
              return reaction;
            });
          } else {
            return [...prev, { emoji, count: 1, users: [user.id] }];
          }
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }, [message.id, user, supabase]);

  // Load reactions
  const loadReactions = useCallback(async () => {
    const { data: dbReactions } = await supabase
      .from('reactions')
      .select('*')
      .eq('message_id', message.id);

    if (dbReactions) {
      // Group reactions by emoji
      const groupedReactions = dbReactions.reduce((acc, reaction) => {
        const existing = acc.find((r: Reaction) => r.emoji === reaction.emoji);
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
      }, [] as Reaction[]);

      setReactions(groupedReactions);
    }
  }, [message.id, supabase]);

  // Load and subscribe to reactions
  useEffect(() => {
    let mounted = true;

    loadReactions();

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`message-reactions-${message.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `message_id=eq.${message.id}`
      }, (payload) => {
        if (!mounted) return;

        // Handle the change immediately instead of reloading all reactions
        if (payload.eventType === 'INSERT') {
          setReactions(prev => {
            const existing = prev.find(r => r.emoji === payload.new.emoji);
            if (existing) {
              return prev.map(reaction => {
                if (reaction.emoji === payload.new.emoji && !reaction.users.includes(payload.new.user_id)) {
                  return {
                    ...reaction,
                    users: [...reaction.users, payload.new.user_id],
                    count: reaction.count + 1
                  };
                }
                return reaction;
              });
            } else {
              return [...prev, { emoji: payload.new.emoji, count: 1, users: [payload.new.user_id] }];
            }
          });
        } else if (payload.eventType === 'DELETE') {
          setReactions(prev => {
            return prev.map(reaction => {
              if (reaction.emoji === payload.old.emoji) {
                const users = reaction.users.filter(id => id !== payload.old.user_id);
                return {
                  ...reaction,
                  users,
                  count: users.length
                };
              }
              return reaction;
            }).filter(reaction => reaction.count > 0);
          });
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [message.id, loadReactions, supabase]);

  const handleThreadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the context menu
    setIsThreadOpen(true);
  }, []);

  const handleReply = useCallback(() => {
    if (onReply) {
      onReply(message);
    } else {
      setReplyTo({
        id: message.id,
        content: message.content,
        author: message.sender.name
      });
    }
  }, [message, setReplyTo, onReply]);

  return (
    <>
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
        <div className={`
          relative
          ${message.metadata?.is_bot ? '' : ''}
        `}>
          {parentMessage && (
            <ParentMessagePreview
              content={parentMessage.content}
              author={{
                name: parentMessage.sender.name,
                avatar: parentMessage.sender.avatar_url || undefined
              }}
              timestamp={parentMessage.created_at}
              onClick={() => onScrollToMessage?.(parentMessage.id)}
              deleted={!!parentMessage.deleted_at}
            />
          )}
          <div className={`
            group flex items-start space-x-4 animate-fade-in rounded-lg
            ${isBeingRepliedTo ? 'bg-amber-50/10 -mx-4 px-4 py-2 border-l-2 border-amber-400' : ''}
            ${message.metadata?.is_bot ? '' : ''}
          `}>
            <Avatar className="cursor-pointer transition-transform hover:scale-105">
              <AvatarImage src={message.sender.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {message.metadata?.is_bot 
                  ? `B${message.metadata.bot_number || ''}` 
                  : message.sender.name?.[0]
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-sm max-w-[80%]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-md font-medium">
                  {message.metadata?.is_bot 
                    ? `Bot ${message.metadata.bot_number || ''}` 
                    : message.sender.name
                  }
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleString()}
                </span>
                {message.metadata?.is_summary && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Summary
                  </span>
                )}
                {message.metadata?.bot_type === 'system' && (
                  <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                    System
                  </span>
                )}
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
                    onSend={handleUpdateMessage}
                    placeholder="Edit your message..."
                    initialContent={message.content}
                    initialType={message.type || 'text'}
                    onCancel={() => setIsEditing(false)}
                  />
                </div>
              ) : (
                <>
                  <div className={`
                    rounded-lg w-fit
                    ${message.type === 'text' ? 'bg-secondary/70 text-foreground p-3' : ''}
                    ${message.metadata?.is_bot ? 'border border-primary/20' : ''}
                  `}>
                    <MessageContent 
                      content={message.content} 
                      type="text"
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
    </>
  );
} 