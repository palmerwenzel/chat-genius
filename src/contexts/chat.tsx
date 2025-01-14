'use client';

import * as React from 'react';

interface ReplyTo {
  id: string;
  content: string;
  author: string;
}

export interface ChatContextType {
  replyTo: ReplyTo | null;
  setReplyTo: (replyTo: ReplyTo | null) => void;
}

export const ChatContext = React.createContext<ChatContextType>({
  replyTo: null,
  setReplyTo: () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [replyTo, setReplyTo] = React.useState<ReplyTo | null>(null);

  return (
    <ChatContext.Provider value={{ replyTo, setReplyTo }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return React.useContext(ChatContext);
} 