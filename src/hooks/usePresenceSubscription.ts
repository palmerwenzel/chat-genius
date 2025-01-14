"use client";

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

interface PresenceUser {
  id: string;
  status: string;
  [key: string]: any;
}

export function usePresenceSubscription<T extends PresenceUser>(
  initialMembers: T[],
  channelId?: string,
  groupId?: string
) {
  const [members, setMembers] = useState(initialMembers);
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Create a channel for presence changes
    const presenceChannel = supabase.channel('presence-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presence' },
        () => refreshMembers()
      )
      .subscribe();

    // If we have channel/group IDs, also listen for member changes
    const memberChannel = channelId && groupId ? 
      supabase.channel('member-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'channel_members',
            filter: `channel_id=eq.${channelId}`,
          },
          () => refreshMembers()
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_members',
            filter: `group_id=eq.${groupId}`,
          },
          () => refreshMembers()
        )
        .subscribe()
      : null;

    async function refreshMembers() {
      const { data } = await supabase
        .from('presence')
        .select('user_id, status');
      
      if (data) {
        setMembers(current =>
          current.map(member => ({
            ...member,
            status: data.find(p => p.user_id === member.id)?.status || 'offline'
          }))
        );
      }
    }

    return () => {
      presenceChannel.unsubscribe();
      if (memberChannel) memberChannel.unsubscribe();
    };
  }, [supabase, channelId, groupId]);

  return members;
}