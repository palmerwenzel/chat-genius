'use client';

import * as React from 'react';

interface ReplyTo {
  id: string;
  content: string;
  author: string;
}

interface ChatContextType {
  replyTo: ReplyTo | null;
  setReplyTo: (replyTo: ReplyTo | null) => void;
}

const ChatContext = React.createContext<ChatContextType | null>(null);

export function useChatContext() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [replyTo, setReplyTo] = React.useState<ReplyTo | null>(null);

  return (
    <ChatContext.Provider value={{ replyTo, setReplyTo }}>
      {children}
    </ChatContext.Provider>
  );
} 