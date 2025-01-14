'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface TypingUser {
  user_id: string;
  started_typing: string;
  user: {
    display_name: string;
  };
}

interface TypingIndicatorProps {
  channelId: string;
  onTypingChange: (channelId: string, isTyping: boolean) => Promise<{ error?: string }>;
  className?: string;
}

export function TypingIndicator({ channelId, onTypingChange, className }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClientComponentClient<Database>();

  // Subscribe to typing status changes
  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase.channel('typing-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `channel_id=eq.${channelId}`,
      }, async () => {
        // Fetch latest typing users
        const { data } = await supabase
          .from('typing_indicators')
          .select('user_id, started_typing, user:users(display_name)')
          .eq('channel_id', channelId);

        if (data) {
          setTypingUsers(data.map(row => ({
            user_id: row.user_id,
            started_typing: row.started_typing,
            user: {
              display_name: row.user.display_name
            }
          })));
        } else {
          setTypingUsers([]);
        }
      })
      .subscribe();

    setIsSubscribed(true);

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, channelId, isSubscribed]);

  // Handle typing events
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    let isCurrentlyTyping = false;

    const handleTyping = async () => {
      if (!isCurrentlyTyping) {
        isCurrentlyTyping = true;
        await onTypingChange(channelId, true);
      }

      // Clear existing timeout
      clearTimeout(typingTimeout);

      // Set new timeout
      typingTimeout = setTimeout(async () => {
        isCurrentlyTyping = false;
        await onTypingChange(channelId, false);
      }, 2000);
    };

    // Add event listeners
    document.addEventListener('keydown', handleTyping);

    return () => {
      document.removeEventListener('keydown', handleTyping);
      clearTimeout(typingTimeout);
      
      // Clean up typing status when unmounting
      if (isCurrentlyTyping) {
        onTypingChange(channelId, false);
      }
    };
  }, [channelId, onTypingChange]);

  if (typingUsers.length === 0) return null;

  const typingText = typingUsers.length === 1
    ? `${typingUsers[0].user.display_name} is typing...`
    : typingUsers.length === 2
    ? `${typingUsers[0].user.display_name} and ${typingUsers[1].user.display_name} are typing...`
    : typingUsers.length === 3
    ? `${typingUsers[0].user.display_name}, ${typingUsers[1].user.display_name}, and ${typingUsers[2].user.display_name} are typing...`
    : `${typingUsers.length} people are typing...`;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className="flex gap-1">
        <span className="animate-bounce">•</span>
        <span className="animate-bounce [animation-delay:0.2s]">•</span>
        <span className="animate-bounce [animation-delay:0.4s]">•</span>
      </div>
      {typingText}
    </div>
  );
} 