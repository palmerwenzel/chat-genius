'use client';

import { useCallback } from 'react';
import { MessageInput } from "@/components/messages/MessageInput";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatInterfaceProps {
  title: string;
  subtitle?: string;
  channelId: string;
  isLoading?: boolean;
  children?: React.ReactNode;
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

  const handleSendMessage = useCallback(async (content: string, type: 'text' | 'code' = 'text') => {
    try {
      // Get current user ID for the message
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: channelId,
          sender_id: user?.id,  // Supabase RLS will validate this matches auth.uid()
          content,
          type
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

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${channelId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) {
        // If it's an auth error, redirect to login
        if (uploadError.message?.includes('auth')) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to upload files.',
            variant: 'destructive',
          });
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('attachments')
        .getPublicUrl(filePath);

      // Send message with attachment
      await handleSendMessage(`[File: ${file.name}](${publicUrl})`, 'text');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    }
  }, [channelId, handleSendMessage, toast, router]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        {children}
      </ScrollArea>

      <div className="p-4 border-t mt-auto">
        <MessageInput
          onSend={handleSendMessage}
          onUploadFile={handleFileUpload}
          disabled={isLoading || !channelId}
          placeholder={!channelId ? "Select a channel to start chatting" : "Type a message..."}
        />
      </div>
    </div>
  );
} 