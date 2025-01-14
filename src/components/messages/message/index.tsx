import { getSupabaseServer } from "@/lib/supabase/server";
import { MessageClient } from "./client";
import { notFound } from "next/navigation";
import type { Database } from "@/types/supabase";

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
  thread_id?: string;
  replying_to_id?: string;
  metadata?: {
    files?: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
    }>;
  };
};

interface MessageProps {
  id: string;
  isBeingRepliedTo?: boolean;
  isThreadMessage?: boolean;
}

export async function Message({ id, isBeingRepliedTo, isThreadMessage }: MessageProps) {
  const supabase = getSupabaseServer();

  // Fetch message data
  const { data: message } = await supabase
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
    .eq('id', id)
    .single();

  if (!message) {
    return notFound();
  }

  // Fetch parent message if this is a reply
  let parentMessage = null;
  if (message.replying_to_id) {
    const { data: parent } = await supabase
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
      .eq('id', message.replying_to_id)
      .single();
    
    if (parent) {
      parentMessage = parent as MessageType;
    }
  }

  // Get initial thread count
  const { count: threadSize } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', message.id);

  // Get initial reactions
  const { data: reactions } = await supabase
    .from('reactions')
    .select('*')
    .eq('message_id', message.id);

  // Group reactions by emoji
  const groupedReactions = reactions?.reduce((acc, reaction: Database['public']['Tables']['reactions']['Row']) => {
    const existing = acc.find((r: { emoji: string }) => r.emoji === reaction.emoji);
    if (existing) {
      existing.users.push(reaction.user_id);
      existing.count++;
    } else {
      acc.push({
        emoji: reaction.emoji,
        count: 1,
        users: [reaction.user_id]
      });
    }
    return acc;
  }, [] as Array<{ emoji: string; count: number; users: string[] }>) ?? [];

  return (
    <MessageClient
      message={message as MessageType}
      parentMessage={parentMessage}
      initialThreadSize={threadSize ?? 0}
      initialReactions={groupedReactions}
      isBeingRepliedTo={isBeingRepliedTo}
      isThreadMessage={isThreadMessage}
    />
  );
}
