'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Messages } from './Messages';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
  replying_to_id?: string;
};

interface MessagesContainerProps {
  channelId: string;
  highlightMessageId?: string;
}

export function MessagesContainer({ channelId, highlightMessageId }: MessagesContainerProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<{ id: string } | null>(null);

  // Load initial messages and set up real-time subscription
  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        // First get the channel ID from the channel name
        const { data: channelData } = await supabase
          .from('channels')
          .select('id')
          .eq('name', channelId)
          .single();

        if (!mounted) return;
        if (!channelData) {
          setChannel(null);
          return;
        }

        setChannel(channelData);

        // Then get messages for this channel
        const { data: messagesData } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey (*)
          `)
          .eq('channel_id', channelData.id)
          .is('thread_id', null)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (!mounted) return;
        
        // Small delay to ensure all message data is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        setMessages(messagesData || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        if (mounted) {
          // Small delay before removing loading state
          setTimeout(() => setIsLoading(false), 100);
        }
      }
    };

    loadMessages();

    // Only set up subscription if we have a valid channel
    if (channel?.id) {
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel(`messages:${channel.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channel.id}`
        }, async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the complete message with sender info
            const { data: newMessage } = await supabase
              .from('messages')
              .select(`
                *,
                sender:users!messages_sender_id_fkey (*)
              `)
              .eq('id', payload.new.id)
              .is('thread_id', null)
              .is('deleted_at', null)
              .single();

            if (newMessage) {
              setMessages(prev => [...prev, newMessage as MessageType]);
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.deleted_at) {
              // Remove deleted messages
              setMessages(prev => prev.filter(msg => msg.id !== payload.new.id));
            } else if (!payload.new.thread_id) {
              // Only update if the message doesn't have a thread_id
              setMessages(prev => prev.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              ));
            } else {
              // Remove the message if it's been added to a thread
              setMessages(prev => prev.filter(msg => msg.id !== payload.new.id));
            }
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [channelId, channel?.id]);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-3">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">Channel not found</h3>
          <p className="text-sm">This channel may have been deleted</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-3">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 animate-pulse" />
          <h3 className="text-lg font-semibold">Loading messages...</h3>
        </div>
      </div>
    );
  }

  return <Messages messages={messages} highlightMessageId={highlightMessageId} />;
} 