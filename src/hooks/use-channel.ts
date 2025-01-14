'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { ChannelService, Channel } from '@/services/channels';
import { handleSupabaseError } from '@/utils/supabase/helpers';

interface UseChannelResult {
  channel: Channel | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseChannelOptions {
  /** Whether to subscribe to real-time updates */
  subscribe?: boolean;
}

/**
 * Hook for fetching and subscribing to a channel
 * @param channelId The ID of the channel to fetch
 * @param options Hook options
 */
export function useChannel(
  channelId: string | null,
  options: UseChannelOptions = {}
): UseChannelResult {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserSupabaseClient();
  const channelService = new ChannelService(supabase);

  // Fetch channel data
  useEffect(() => {
    if (!channelId) {
      setChannel(null);
      setIsLoading(false);
      return;
    }

    async function fetchChannel(id: string) {
      try {
        setIsLoading(true);
        setError(null);

        const channel = await channelService.getChannelById(id);
        setChannel(channel);
      } catch (error) {
        console.error('Error fetching channel:', handleSupabaseError(error));
        setError(error instanceof Error ? error : new Error('Failed to fetch channel'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchChannel(channelId);
  }, [channelId]);

  // Subscribe to channel updates
  useEffect(() => {
    if (!channelId || !options.subscribe) return;

    const subscription = supabase
      .channel(`channel:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `id=eq.${channelId}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setChannel(null);
            return;
          }

          try {
            const channel = await channelService.getChannelById(channelId);
            setChannel(channel);
          } catch (error) {
            console.error('Error fetching updated channel:', handleSupabaseError(error));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId, options.subscribe, supabase]);

  return {
    channel,
    isLoading,
    error,
  };
} 