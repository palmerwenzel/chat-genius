"use client";

import * as React from 'react';
import { MessageInput } from "@/components/messages/message-input";
import { useChatContext } from '@/contexts/chat';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { TypingList } from '@/components/presence/typing-indicator/typing-list';
import { useAuth } from '@/stores/auth';

interface ChatInterfaceProps {
  title: string;
  subtitle?: string;
  channelId: string;
  /** Required for routing and future group-specific features */
  groupId: string;
  children?: React.ReactNode;
}

const supabase = createClientComponentClient<Database>();

/**
 * Chat interface component that handles messages, typing indicators, and file uploads.
 * Note: groupId is required for routing structure and will be used for future group-specific features.
 */
export function ChatInterface({
  title,
  subtitle,
  channelId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  groupId, // Required for routing structure and future features
  children,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const context = useChatContext();
  const messageInputRef = React.useRef<{ focus: () => void }>(null);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  // Focus input when replying
  React.useEffect(() => {
    if (context.replyTo) {
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  }, [context.replyTo]);

  // Subscribe to typing status changes
  React.useEffect(() => {
    if (!channelId || !user) return;

    const fetchTypingUsers = async () => {
      const { data: typingData } = await supabase
        .from('channel_typing')
        .select(`
          user_id,
          users (
            name
          )
        `)
        .eq('channel_id', channelId)
        .eq('is_typing', true)
        .neq('user_id', user.id);

      const typingUserNames = (typingData as { user_id: string; users: { name: string } | null }[] | null)
        ?.filter(d => d.users !== null)
        .map(d => d.users!.name) || [];

      setTypingUsers(typingUserNames);
    };

    // Fetch initial state
    fetchTypingUsers();

    // Subscribe to changes
    const channel = supabase.channel(`typing:${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_typing',
        filter: `channel_id=eq.${channelId}`,
      }, () => {
        fetchTypingUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, user]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hover:pr-0 pr-[12px] transition-[padding] duration-150 flex flex-col min-h-0">
        <div className="flex-1">
          {children}
        </div>
        {typingUsers.length > 0 && (
          <div className="px-6 py-2">
            <TypingList users={typingUsers} />
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <MessageInput
          ref={messageInputRef}
          channelId={channelId}
          replyTo={context.replyTo || undefined}
          onCancelReply={() => context.setReplyTo(null)}
        />
      </div>
    </div>
  );
} 