'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export function useGroupSubscription(userId: string) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to both public group changes and user's group membership changes
    const channel = supabase.channel('group-changes')
      // Listen for public group changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: 'visibility=eq.public'
        },
        (payload) => {
          console.log('Public group change:', payload);
          router.refresh();
        }
      )
      // Listen for user's group membership changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Group membership change:', payload);
          router.refresh();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to group changes');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to group changes');
        }
      });

    return () => {
      console.log('Unsubscribing from group changes');
      channel.unsubscribe();
    };
  }, [userId, router, supabase]);
} 