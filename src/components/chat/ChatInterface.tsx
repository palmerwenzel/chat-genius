'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MessageInput } from "@/components/messages/MessageInput";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/stores/auth';
import { useChatContext } from '@/contexts/chat';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { storageService } from '@/services/storage';
import { TypingIndicator } from '@/components/presence/TypingIndicator';
import { parseBotCommand } from '@/lib/bot-commands';
import { handleBotCommand } from '@/lib/bot-command-handlers';

interface ChatInterfaceProps {
  title: string;
  subtitle?: string;
  channelId: string;
  groupId: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

const supabase = createClientComponentClient<Database>();

export function ChatInterface({
  title,
  subtitle,
  channelId,
  groupId,
  isLoading,
  children,
}: ChatInterfaceProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { replyTo, setReplyTo } = useChatContext();
  const messageInputRef = React.useRef<{ focus: () => void }>(null);
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  const scrollToMessage = React.useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Focus input when replying
  React.useEffect(() => {
    if (replyTo) {
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  }, [replyTo]);

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
        .neq('user_id', user.id); // Don't show current user

      const typingUserNames = (typingData as TypingData[] | null)
        ?.filter(d => d.users !== null)
        .map(d => d.users!.name) || [];

      setTypingUsers(typingUserNames);
    };

    // Fetch initial state
    fetchTypingUsers();

    type TypingData = {
      user_id: string;
      users: Database['public']['Tables']['users']['Row'] | null;
    };

    // Subscribe to changes
    const channel = supabase.channel(`typing:${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'channel_typing',
        filter: `channel_id=eq.${channelId}`,
      }, () => {
        // Refetch typing users when changes occur
        fetchTypingUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, user]);

  async function handleSendMessage(content: string, type: 'text' | 'code', attachments?: File[], replyTo?: { id: string; content: string; author: string }) {
    try {
      // Handle bot commands
      const botCommand = parseBotCommand(content);
      if (botCommand) {
        await handleBotCommand(botCommand, {
          channelId,
          supabase,
          toast
        });
        return;
      }

      // If not a bot command, proceed with normal message sending
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          sender_id: user?.id,
          content,
          type,
          replying_to_id: replyTo?.id,
          metadata: attachments ? { 
            files: attachments.map(file => ({
              name: file.name,
              size: file.size,
              type: file.type
            }))
          } : {}
        })
        .select()
        .single();

      if (messageError) {
        // If it's an auth error, redirect to login
        if (messageError.code === 'PGRST301' || messageError.message?.includes('auth')) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to send messages.',
            variant: 'destructive',
          });
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        throw messageError;
      }

      // If there are attachments, upload them
      if (attachments?.length) {
        const uploadedFiles = await Promise.all(
          attachments.map(async (file) => {
            const publicUrl = await storageService.uploadFile('attachments', file, {
              name: file.name,
              size: file.size,
              mimeType: file.type,
              channelId,
              groupId,
              messageId: message.id
            }, user!.id);

            if (!publicUrl) {
              throw new Error('Failed to upload file');
            }

            return {
              url: publicUrl,
              type: file.type,
              name: file.name,
              size: file.size
            };
          })
        );

        // Update the message with file metadata
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            metadata: {
              files: uploadedFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url
              }))
            }
          })
          .eq('id', message.id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      });
    }
  }

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

      <div className="flex-1 overflow-y-auto transition-[padding] duration-150 flex flex-col min-h-0">
        <div className="flex-1">
          {children}
        </div>
        {typingUsers.length > 0 && (
          <div className="px-6 py-2">
            <TypingIndicator users={typingUsers} />
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <MessageInput
          ref={messageInputRef}
          onSend={handleSendMessage}
          disabled={isLoading}
          replyTo={replyTo || undefined}
          onCancelReply={() => setReplyTo(null)}
          onNavigateToMessage={scrollToMessage}
          channelId={channelId}
        />
      </div>
    </div>
  );
} 