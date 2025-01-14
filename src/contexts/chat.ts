"use client";

import { createContext, useContext } from "react";

type ChatContextType = {
  // Define any context data/logic you want here
};

export const ChatContext = createContext<ChatContextType>({});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  // Set up local state, etc.
  const value = {};

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}