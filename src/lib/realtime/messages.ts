'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { logger } from '@/lib/logger';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message, Reaction } from '@/types/messages';

type RealtimeMessageCallback = (message: Message) => void;
type RealtimeReactionCallback = (reaction: Reaction) => void;

export function subscribeToChannelMessages(
  channelId: string,
  callback: RealtimeMessageCallback
) {
  const supabase = createClientComponentClient<Database>();

  try {
    const subscription = supabase
      .channel(`channel-${channelId}-messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (!payload.new || !('id' in payload.new)) return;
          callback(payload.new as Message);
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          logger.info('realtime.messages.subscribed', { channelId });
        }
      });

    return () => {
      subscription.unsubscribe();
      logger.info('realtime.messages.unsubscribed', { channelId });
    };
  } catch (error) {
    logger.error('realtime.messages.subscribe', error as Error, { channelId });
    throw error;
  }
}

export function subscribeToThreadMessages(
  threadId: string,
  callback: RealtimeMessageCallback
) {
  const supabase = createClientComponentClient<Database>();

  try {
    const subscription = supabase
      .channel(`thread-${threadId}-messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (!payload.new || !('id' in payload.new)) return;
          callback(payload.new as Message);
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          logger.info('realtime.thread.subscribed', { threadId });
        }
      });

    return () => {
      subscription.unsubscribe();
      logger.info('realtime.thread.unsubscribed', { threadId });
    };
  } catch (error) {
    logger.error('realtime.thread.subscribe', error as Error, { threadId });
    throw error;
  }
}

export function subscribeToReactions(
  messageId: string,
  callback: RealtimeReactionCallback
) {
  const supabase = createClientComponentClient<Database>();

  try {
    const subscription = supabase
      .channel(`message-${messageId}-reactions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `message_id=eq.${messageId}`,
        },
        (payload: RealtimePostgresChangesPayload<Reaction>) => {
          if (!payload.new || !('id' in payload.new)) return;
          callback(payload.new as Reaction);
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status === 'SUBSCRIBED') {
          logger.info('realtime.reactions.subscribed', { messageId });
        }
      });

    return () => {
      subscription.unsubscribe();
      logger.info('realtime.reactions.unsubscribed', { messageId });
    };
  } catch (error) {
    logger.error('realtime.reactions.subscribe', error as Error, { messageId });
    throw error;
  }
} 