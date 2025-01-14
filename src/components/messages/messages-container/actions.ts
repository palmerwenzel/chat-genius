'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
};

export async function getMessages(channelId: string) {
  const supabase = getSupabaseServer();

  const { data: messages, error } = await supabase
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
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return messages as MessageType[];
}

export async function getMessageById(messageId: string) {
  const supabase = getSupabaseServer();

  const { data: message, error } = await supabase
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
    .eq('id', messageId)
    .single();

  if (error) throw error;
  return message as MessageType;
} 