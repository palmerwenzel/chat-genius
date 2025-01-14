import type { Database } from '@/types/supabase';

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type Reaction = Database['public']['Tables']['reactions']['Row'];
export type ReactionInsert = Database['public']['Tables']['reactions']['Insert'];

export interface MessageWithReactions extends Message {
  reactions: Reaction[];
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
}

export interface UpdateMessageData {
  content?: string;
  type?: 'text';
  metadata?: {
    files?: Array<{
      name: string;
      size: number;
      type: string;
      url: string;
    }>;
  };
}

export interface CreateMessageData {
  channelId: string;
  content: string;
  type?: 'text';
  threadId?: string;
} 