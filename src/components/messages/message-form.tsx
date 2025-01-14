'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { handleSupabaseError } from '@/utils/supabase/helpers';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { MessageService } from '@/services/messages';
import { AuthService } from '@/services/auth';

interface MessageFormProps {
  className?: string;
  channelId: string;
  onSuccess?: () => void;
}

/**
 * Client Component for sending messages in a channel
 */
export function MessageForm({ className, channelId, onSuccess }: MessageFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const supabase = createBrowserSupabaseClient();
  const messageService = new MessageService(supabase);
  const authService = new AuthService(supabase);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }, [content]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate message content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('Message cannot be empty');
      setIsLoading(false);
      return;
    }

    try {
      // Get current user
      const session = await authService.getSession();
      if (!session?.user) {
        setError('You must be logged in to send messages');
        return;
      }

      // Create message
      await messageService.createMessage({
        channel_id: channelId,
        user_id: session.user.id,
        content: trimmedContent
      });

      // Reset form
      setContent('');

      // Call success callback if provided
      onSuccess?.();

      // Refresh the page to show new message
      router.refresh();
    } catch (error) {
      console.error('Message creation error:', handleSupabaseError(error));
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Ctrl+Enter or Cmd+Enter to submit
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isLoading) {
        onSubmit(e);
      }
    }
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isLoading}
          rows={1}
          className="min-h-[44px] resize-none"
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Press Ctrl+Enter to send</span>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
} 