'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, ArrowDown } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { MessageContent } from '@/components/messages/MessageContent';
import { MessageActions } from '@/components/messages/MessageActions';
import { LinkPreview } from '@/components/messages/LinkPreview';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui/button';

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  }
};

interface ChatAreaProps {
  channelId: string;
}

// Keep a cache of messages per channel
const messageCache: Record<string, Message[]> = {};

export function ChatArea({ channelId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>(() => messageCache[channelId] || []);
  const [loading, setLoading] = useState(!messageCache[channelId]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Function to check if we're near bottom
  const isNearBottom = useCallback(() => {
    const container = scrollAreaRef.current;
    if (!container) return true;
    
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessages(false);
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    setShowScrollButton(!isNearBottom());
  }, [isNearBottom]);

  // Reset state when channel changes
  useEffect(() => {
    setMessages(messageCache[channelId] || []);
    setLoading(!messageCache[channelId]);
    setHasNewMessages(false);
    
    // If we have cached messages, scroll to bottom after a short delay
    if (messageCache[channelId]) {
      setTimeout(scrollToBottom, 50);
    }
  }, [channelId, scrollToBottom]);

  useEffect(() => {
    if (!channelId) return;

    let mounted = true;

    async function loadMessages() {
      try {
        const { data: messages, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey (*)
          `)
          .eq('channel_id', channelId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        if (mounted) {
          messageCache[channelId] = messages as Message[];
          setMessages(messages as Message[]);
          setLoading(false);
          
          // Only scroll if we didn't have cached messages
          if (!messageCache[channelId]) {
            setTimeout(scrollToBottom, 50);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        if (mounted) setLoading(false);
      }
    }

    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          try {
            const { data } = await supabase
              .from('messages')
              .select(`
                *,
                sender:users!messages_sender_id_fkey (*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data && mounted) {
              const newMessage = data as Message;
              messageCache[channelId] = [...(messageCache[channelId] || []), newMessage];
              setMessages(prev => [...prev, newMessage]);
              
              if (isNearBottom()) {
                setTimeout(scrollToBottom, 50);
              } else {
                setHasNewMessages(true);
              }
            }
          } catch (error) {
            console.error('Error fetching new message:', error);
          }
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [channelId, scrollToBottom, isNearBottom]);

  return (
    <div className="relative flex-1">
      <ScrollArea 
        ref={scrollAreaRef} 
        className="flex-1 h-full animate-fade-in"
        onScroll={handleScroll}
      >
        <div className="space-y-6 p-4">
          {messages.map((message, index) => {
            const isCurrentUser = message.sender.id === user?.id;
            const urls = message.content.match(/https?:\/\/[^\s]+/g) || [];
            const isLastMessage = index === messages.length - 1;

            return (
              <div 
                key={message.id} 
                className="group flex items-start space-x-4 animate-fade-in"
                ref={isLastMessage ? lastMessageRef : undefined}
              >
                {!isCurrentUser && (
                  <Avatar className="transition-transform group-hover:scale-105">
                    <AvatarImage src={message.sender.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{message.sender.name?.[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${isCurrentUser ? 'items-end ml-auto' : 'items-start'} max-w-[80%]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{message.sender.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className={`
                    rounded-lg w-fit
                    ${message.type === 'code' ? 'bg-muted font-mono' : 'bg-primary/10 text-foreground p-3'}
                    ${isCurrentUser ? 'bg-primary' : ''}
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

                  {/* Message Actions */}
                  <div className="flex items-center gap-2 mt-1">
                    <MessageActions
                      messageId={message.id}
                      hasThread={!!message.parent_id}
                      onThreadClick={() => {}}
                      onReactionClick={() => {}}
                    />
                  </div>
                </div>
                {isCurrentUser && (
                  <Avatar className="transition-transform group-hover:scale-105">
                    <AvatarImage src={message.sender.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{message.sender.name?.[0]}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {(showScrollButton || hasNewMessages) && (
        <Button
          size="sm"
          className="absolute bottom-4 right-4 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4 mr-2" />
          {hasNewMessages ? 'New Messages' : 'Scroll to Bottom'}
        </Button>
      )}
    </div>
  );
} 