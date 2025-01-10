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
import { supabase } from '@/lib/supabase';
import { useChatContext } from '@/contexts/chat';
import { MessageInput } from '@/components/messages/MessageInput';

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
  thread_id?: string;
  replying_to_id?: string;
};

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageProps {
  message: MessageType;
  isBeingRepliedTo?: boolean;
  onScrollToMessage?: (messageId: string) => void;
}

export function Message({ message, isBeingRepliedTo, onScrollToMessage }: MessageProps) {
  const { setReplyTo } = useChatContext();
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [threadCount, setThreadCount] = useState(0);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [parentMessage, setParentMessage] = useState<MessageType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const urls = message.content.match(/https?:\/\/[^\s]+/g) || [];

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

    const loadThreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('thread_id', message.id);

      if (mounted && count !== null) {
        setThreadCount(count);
      }
    };

    loadThreadCount();

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
        loadThreadCount();
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
      if (error instanceof Error && error.message.includes('Results contain 0 rows')) {
        console.log('No existing reaction found, adding new one');
        // No existing reaction, add new one
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
      } else {
        console.error('Error toggling reaction:', error);
      }
    }
  }, [message.id, user]);

  // Load and subscribe to reactions
  useEffect(() => {
    let mounted = true;

    // Load initial reactions
    const loadReactions = async () => {
      console.log('Loading reactions for message:', message.id);
      const { data } = await supabase
        .from('reactions')
        .select('emoji, user_id')
        .eq('message_id', message.id);

      console.log('Raw reaction data:', data);

      if (mounted && data) {
        // Group reactions by emoji
        const reactionGroups = data.reduce((acc, { emoji, user_id }) => {
          const existing = acc.find(r => r.emoji === emoji);
          if (existing) {
            if (!existing.users.includes(user_id)) {
              existing.users.push(user_id);
              existing.count++;
              console.log(`Incremented count for ${emoji}, new count:`, existing.count);
            }
          } else {
            acc.push({ emoji, count: 1, users: [user_id] });
            console.log(`Added new reaction for ${emoji}`);
          }
          return acc;
        }, [] as Reaction[]);

        // Sort reactions by count (most popular first)
        const validReactions = reactionGroups
          .filter(reaction => {
            const isValid = reaction.count > 0;
            console.log(`Reaction ${reaction.emoji}: count=${reaction.count}, valid=${isValid}`);
            return isValid;
          })
          .sort((a, b) => b.count - a.count);

        console.log('Final processed reactions:', validReactions);
        setReactions(validReactions);
      } else {
        console.log('No reactions found or component unmounted');
        setReactions([]);
      }
    };

    loadReactions();

    // Subscribe to reaction changes
    const subscription = supabase
      .channel(`message-reactions-${message.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `message_id=eq.${message.id}`
      }, async (payload) => {
        console.log('Reaction change detected:', payload);
        
        if (payload.eventType === 'DELETE' && payload.old) {
          console.log('Processing delete event:', payload.old);
          // For deletes, immediately update the local state
          setReactions(prev => {
            console.log('Current reactions:', prev);
            const emoji = payload.old.emoji;
            const userId = payload.old.user_id;
            
            // First update the counts
            const updatedReactions = prev.map(reaction => {
              if (reaction.emoji === emoji) {
                // Remove user and decrement count
                const users = reaction.users.filter(id => id !== userId);
                console.log(`Removing user ${userId} from ${emoji}, new users:`, users);
                return {
                  ...reaction,
                  users,
                  count: users.length
                };
              }
              return reaction;
            });
            
            // Then filter out any reactions with zero count
            const finalReactions = updatedReactions.filter(reaction => reaction.count > 0);
            console.log('Updated reactions:', finalReactions);
            return finalReactions;
          });
        } else if (payload.eventType === 'INSERT' && payload.new) {
          // For inserts, immediately update the local state
          setReactions(prev => {
            const emoji = payload.new.emoji;
            const userId = payload.new.user_id;
            
            const existing = prev.find(r => r.emoji === emoji);
            if (existing) {
              return prev.map(reaction => {
                if (reaction.emoji === emoji && !reaction.users.includes(userId)) {
                  return {
                    ...reaction,
                    users: [...reaction.users, userId],
                    count: reaction.count + 1
                  };
                }
                return reaction;
              });
            } else {
              return [...prev, { emoji, count: 1, users: [userId] }];
            }
          });
        }

        // Always do a full reload after a short delay to ensure consistency
        await new Promise(resolve => setTimeout(resolve, 100));
        loadReactions();
      })
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [message.id]);

  const handleThreadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the context menu
    setIsThreadOpen(true);
  }, []);

  return (
    <>
      <MessageActions
        messageId={message.id}
        replyCount={threadCount}
        content={message.content}
        author={{
          name: message.sender.name,
          avatar: message.sender.avatar_url || undefined
        }}
        timestamp={message.created_at}
        isThreadOpen={isThreadOpen}
        onThreadOpen={() => setIsThreadOpen(true)}
        onThreadClose={() => setIsThreadOpen(false)}
        onReply={(replyTo) => setReplyTo(replyTo)}
        onEdit={() => user?.id === message.sender.id && setIsEditing(true)}
        channelId={message.channel_id}
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
              onClick={() => onScrollToMessage?.(parentMessage.id)}
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
                {threadCount > 0 && (
                  <button
                    onClick={handleThreadClick}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group/thread"
                  >
                    <Reply className="h-3 w-3 text-amber-400 group-hover/thread:text-amber-500 transition-colors" />
                    {threadCount} thread replies
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
                    ${message.type === 'code' ? 'bg-muted font-mono' : 'bg-secondary/70 text-foreground p-3'}
                  `}>
                    <MessageContent content={message.content} type={message.type || 'text'} />
                  </div>

                  {/* Link Previews */}
                  {urls.length > 0 && message.type !== 'code' && (
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