'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export function useChannelSubscription(groupId: string | undefined, userId: string) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!groupId || !userId) return;

    // Subscribe to channel changes and memberships for this group
    const channel = supabase.channel(`group-${groupId}-channels`)
      // Listen for channel changes in this group
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('Channel change:', payload);
          router.refresh();
        }
      )
      // Listen for channel membership changes for this user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channel_members',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Channel membership change:', payload);
          router.refresh();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to channel changes');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to channel changes');
        }
      });

    return () => {
      console.log('Unsubscribing from channel changes');
      channel.unsubscribe();
    };
  }, [groupId, userId, router, supabase]);
} 