'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { MessageService, Message } from '@/services/messages';
import { handleSupabaseError } from '@/utils/supabase/helpers';

interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

interface UseMessagesOptions {
  /** Whether to subscribe to real-time updates */
  subscribe?: boolean;
  /** Initial number of messages to load */
  initialLimit?: number;
  /** Number of messages to load per page */
  pageSize?: number;
}

/**
 * Hook for fetching and subscribing to channel messages
 * @param channelId The ID of the channel to fetch messages for
 * @param options Hook options
 */
export function useMessages(
  channelId: string | null,
  options: UseMessagesOptions = {}
): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const supabase = createBrowserSupabaseClient();
  const messageService = new MessageService(supabase);

  const limit = options.initialLimit || 50;
  const pageSize = options.pageSize || 25;

  // Fetch messages
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setIsLoading(false);
      setHasMore(false);
      return;
    }

    async function fetchMessages(id: string) {
      try {
        setIsLoading(true);
        setError(null);

        const messages = await messageService.getChannelMessages(id, limit, 0);
        setMessages(messages);
        setOffset(messages.length);
        setHasMore(messages.length === limit);
      } catch (error) {
        console.error('Error fetching messages:', handleSupabaseError(error));
        setError(error instanceof Error ? error : new Error('Failed to fetch messages'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages(channelId);
  }, [channelId, limit]);

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!channelId || !hasMore || isLoading) return;

    try {
      setIsLoading(true);
      const moreMessages = await messageService.getChannelMessages(channelId, pageSize, offset);
      setMessages(prev => [...prev, ...moreMessages]);
      setOffset(prev => prev + moreMessages.length);
      setHasMore(moreMessages.length === pageSize);
    } catch (error) {
      console.error('Error loading more messages:', handleSupabaseError(error));
      setError(error instanceof Error ? error : new Error('Failed to load more messages'));
    } finally {
      setIsLoading(false);
    }
  }, [channelId, hasMore, isLoading, offset, pageSize]);

  // Subscribe to message updates
  useEffect(() => {
    if (!channelId || !options.subscribe) return;

    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            try {
              const message = await messageService.getMessageById(payload.new.id);
              if (message) {
                setMessages(prev => [message, ...prev]);
              }
            } catch (error) {
              console.error('Error fetching new message:', handleSupabaseError(error));
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            try {
              const message = await messageService.getMessageById(payload.new.id);
              if (message) {
                setMessages(prev => prev.map(m => m.id === message.id ? message : m));
              }
            } catch (error) {
              console.error('Error fetching updated message:', handleSupabaseError(error));
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId, options.subscribe, supabase]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
  };
} 