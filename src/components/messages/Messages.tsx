import { createServerSupabase } from '@/lib/server-supabase';
import { Database } from '@/types/supabase';
import { Message } from '@/components/messages/Message';
import { MessageCircle } from 'lucide-react';

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  }
};

interface MessagesProps {
  channelId: string;
}

export async function Messages({ channelId }: MessagesProps) {
  const supabase = await createServerSupabase();

  // First get the channel ID from the channel name
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('name', channelId)
    .single();

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-3">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">Channel not found</h3>
          <p className="text-sm">This channel may have been deleted</p>
        </div>
      </div>
    );
  }

  // Then get messages for this channel
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey (*)
    `)
    .eq('channel_id', channel.id)
    .order('created_at', { ascending: true });

  if (!messages?.length) {
    return (
      <div className="relative w-full" style={{ height: 'calc(100vh - 8rem)' }}>
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-3">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No messages yet</h3>
            <p className="text-sm">Start a conversation by sending a message below.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 space-y-6">
      {messages.map((message: MessageType) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
} 