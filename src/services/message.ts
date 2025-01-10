import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { realtimeManager } from '@/lib/realtime';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type Reaction = Database['public']['Tables']['reactions']['Row'];
type ReactionInsert = Database['public']['Tables']['reactions']['Insert'];

interface CreateMessageData {
  channelId: string;
  content: string;
  type?: 'text' | 'code';
  threadId?: string;
}

interface UpdateMessageData {
  content?: string;
}

interface MessageWithReactions extends Message {
  reactions: Reaction[];
}

class MessageService {
  /**
   * Create a new message
   */
  async createMessage(data: CreateMessageData): Promise<Message | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const message: MessageInsert = {
      channel_id: data.channelId,
      user_id: user.id,
      content: data.content,
      type: data.type || 'text',
      parent_id: data.threadId,
    };

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return null;
    }

    return newMessage;
  }

  /**
   * Get messages for a channel
   */
  async getChannelMessages(
    channelId: string,
    limit = 50,
    before?: string
  ): Promise<MessageWithReactions[]> {
    let query = supabase
      .from('messages')
      .select('*, reactions(*)')
      .eq('channel_id', channelId)
      .is('parent_id', null) // Only get main messages, not thread replies
      .is('deleted_at', null) // Don't show deleted messages
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return messages as MessageWithReactions[];
  }

  /**
   * Get thread messages
   */
  async getThreadMessages(
    threadId: string,
    limit = 50,
    before?: string
  ): Promise<MessageWithReactions[]> {
    let query = supabase
      .from('messages')
      .select('*, reactions(*)')
      .eq('parent_id', threadId)
      .is('deleted_at', null) // Don't show deleted messages
      .order('created_at', { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching thread messages:', error);
      return [];
    }

    return messages as MessageWithReactions[];
  }

  /**
   * Update a message
   */
  async updateMessage(messageId: string, data: UpdateMessageData): Promise<Message | null> {
    const { data: updatedMessage, error } = await supabase
      .from('messages')
      .update(data)
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      return null;
    }

    return updatedMessage;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        deleted_at: new Date().toISOString(),
        content: '[Message deleted]'
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }

    return true;
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<Reaction | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const reaction: ReactionInsert = {
      message_id: messageId,
      user_id: user.id,
      emoji,
    };

    const { data: newReaction, error } = await supabase
      .from('reactions')
      .insert(reaction)
      .select()
      .single();

    if (error) {
      console.error('Error adding reaction:', error);
      return null;
    }

    return newReaction;
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (error) {
      console.error('Error removing reaction:', error);
      return false;
    }

    return true;
  }

  /**
   * Subscribe to channel messages
   */
  async subscribeToChannelMessages(
    channelId: string,
    callback: (message: Message) => void
  ): Promise<string> {
    return realtimeManager.subscribe({
      table: 'messages',
      event: '*',
      filter: `channel_id=eq.${channelId}`,
    }, (payload) => {
      if (payload.new) {
        callback(payload.new as Message);
      }
    });
  }

  /**
   * Subscribe to thread messages
   */
  async subscribeToThreadMessages(
    threadId: string,
    callback: (message: Message) => void
  ): Promise<string> {
    return realtimeManager.subscribe({
      table: 'messages',
      event: '*',
      filter: `parent_id=eq.${threadId}`,
    }, (payload) => {
      if (payload.new) {
        callback(payload.new as Message);
      }
    });
  }

  /**
   * Subscribe to message reactions
   */
  async subscribeToReactions(
    messageId: string,
    callback: (reaction: Reaction) => void
  ): Promise<string> {
    return realtimeManager.subscribe({
      table: 'reactions',
      event: '*',
      filter: `message_id=eq.${messageId}`,
    }, (payload) => {
      if (payload.new) {
        callback(payload.new as Reaction);
      }
    });
  }
}

// Export a singleton instance
export const messageService = new MessageService(); 