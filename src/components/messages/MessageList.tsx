'use client';

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';

const supabase = createClientComponentClient<Database>();

interface MessageListProps {
  channelId: string;
  children: React.ReactNode;
}

export function MessageList({ channelId, children }: MessageListProps) {
  const router = useRouter();

  useEffect(() => {
    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId, router]);

  // Pass through children directly without wrapping div to avoid interfering with layout
  return children;
} 