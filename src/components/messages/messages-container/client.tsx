"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/types/supabase";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
};

interface MessagesContainerProps {
  channelId: string;
  initialMessages: MessageType[];
  highlightMessageId?: string;
  highlightedMessage?: MessageType;
}

const supabase = createClientComponentClient<Database>();

export function MessagesContainer({
  channelId,
  initialMessages,
  highlightMessageId,
  highlightedMessage,
}: MessagesContainerProps) {
  const [messages, setMessages] = useState<MessageType[]>(() => {
    if (highlightedMessage && !initialMessages.find(m => m.id === highlightedMessage.id)) {
      return [highlightedMessage, ...initialMessages];
    }
    return initialMessages;
  });

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(
                id,
                name,
                avatar_url,
                email
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages(prev => [newMessage as MessageType, ...prev]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  return (
    <div className="p-2 flex-1 overflow-y-auto">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-2 ${highlightMessageId === msg.id ? "bg-amber-50/10" : ""}`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{msg.sender.name}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(msg.created_at).toLocaleString()}
            </span>
          </div>
          <div className="mt-1">{msg.content}</div>
        </div>
      ))}
    </div>
  );
}