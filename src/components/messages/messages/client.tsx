'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Database } from '@/types/supabase';
import { Message } from '@/components/messages/Message';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatContext } from '@/contexts/chat';

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  }
};

interface MessagesProps {
  messages: MessageType[];
  highlightMessageId?: string;
}

export function Messages({ messages, highlightMessageId }: MessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeHighlight, setActiveHighlight] = useState(highlightMessageId);
  const { replyTo } = useChatContext();
  const lastMessageLengthRef = useRef(messages.length);
  const isNewMessage = messages.length > lastMessageLengthRef.current;

  const scrollToMessage = useCallback((messageId: string) => {
    setActiveHighlight(messageId);
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Clear the highlight after 1.5 seconds with a fade out
      const timer = setTimeout(() => {
        setActiveHighlight(undefined);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
    lastMessageLengthRef.current = messages.length;
  }, [messages.length, isNewMessage]);

  // Handle initial scroll and highlight
  useEffect(() => {
    if (highlightMessageId) {
      scrollToMessage(highlightMessageId);
    } else if (messages.length > 0) {
      // Ensure scroll happens after all messages are rendered
      requestAnimationFrame(() => {
        // Double RAF to ensure all painting is complete
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        });
      });
    }
  }, [highlightMessageId, messages.length, scrollToMessage]);

  if (!messages?.length) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-muted-foreground">No messages yet</h3>
          <p className="text-sm text-muted-foreground/80">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 min-h-0">
      {messages.map((message) => (
        <div
          key={message.id}
          id={`message-${message.id}`}
          className={cn(
            'px-4 py-1 border-l-2 border-transparent transition-[background-color,border-color] duration-1000',
            (message.id === activeHighlight || message.id === highlightMessageId) && [
              'border-amber-400 bg-amber-50/10'
            ]
          )}
        >
          <Message 
            message={message} 
            isBeingRepliedTo={replyTo?.id === message.id}
            onScrollToMessage={scrollToMessage}
          />
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
} 