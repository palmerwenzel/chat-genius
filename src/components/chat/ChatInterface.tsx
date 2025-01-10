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

  const handleSendMessage = React.useCallback(async (
    content: string, 
    type: 'text' | 'code' = 'text',
    attachments?: File[],
    replyTo?: { id: string; content: string; author: string }
  ) => {
    try {
      // First create the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          sender_id: user?.id,
          content,
          type,
          replying_to_id: replyTo?.id,
          metadata: attachments ? { isFileUpload: true } : undefined
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
              size: file.size,
              mimeType: file.type,
              filename: file.name,
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
              isFileUpload: true,
              attachments: uploadedFiles
            }
          })
          .eq('id', message.id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [channelId, groupId, user, toast, router]);

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
        {children}
      </div>

        <div className="p-4 mt-2 border-t">
          <MessageInput
            ref={messageInputRef}
            onSend={handleSendMessage}
            disabled={isLoading}
            replyTo={replyTo || undefined}
            onCancelReply={() => setReplyTo(null)}
            onNavigateToMessage={scrollToMessage}
          />
        </div>
    </div>
  );
} 