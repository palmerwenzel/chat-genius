'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MessageInput } from "@/components/messages/MessageInput";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/stores/auth';
import { useChatContext } from '@/contexts/chat';
import { supabase } from '@/lib/supabase';
import { storageService } from '@/services/storage';

interface ChatInterfaceProps {
  title: string;
  subtitle?: string;
  channelId: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function ChatInterface({
  title,
  subtitle,
  channelId,
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
    replyTo?: { id: string; content: string; author: string }
  ) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          sender_id: user?.id,
          content,
          type,
          replying_to_id: replyTo?.id
        });

      if (error) {
        // If it's an auth error, redirect to login
        if (error.code === 'PGRST301' || error.message?.includes('auth')) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to send messages.',
            variant: 'destructive',
          });
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [channelId, user?.id, toast, router]);

  const handleFileUpload = React.useCallback(async (file: File) => {
    try {
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to upload files.',
          variant: 'destructive',
        });
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      console.log('Starting file upload:', {
        name: file.name,
        type: file.type,
        size: file.size,
        channelId,
        user: user.id
      });

      // Verify channel ID format
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!UUID_REGEX.test(channelId)) {
        console.error('Invalid channel ID format:', channelId);
        throw new Error('Invalid channel ID format');
      }

      const publicUrl = await storageService.uploadFile('attachments', file, {
        size: file.size,
        mimeType: file.type,
        filename: file.name,
        channelId
      }, user.id);

      if (!publicUrl) {
        console.error('No public URL returned from upload');
        throw new Error('Failed to upload file');
      }

      console.log('File uploaded successfully, public URL:', publicUrl);

      // Send the message with the file URL
      await handleSendMessage(publicUrl, 'text');
      console.log('Message with file URL sent successfully');

    } catch (error) {
      console.error('Error uploading file:', error);
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to upload file. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to upload file. Please try again.',
          variant: 'destructive',
        });
      }
      throw error;
    }
  }, [channelId, handleSendMessage, toast, user, router]);

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
            onUploadFile={handleFileUpload}
            disabled={isLoading}
            replyTo={replyTo || undefined}
            onCancelReply={() => setReplyTo(null)}
            onNavigateToMessage={scrollToMessage}
          />
        </div>
    </div>
  );
} 