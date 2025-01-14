import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageParams {
  channel_id: string;
  user_id: string;
  content: string;
}

export interface UpdateMessageParams {
  content: string;
}

export class MessageService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get messages for a channel with pagination
   * @param channelId The channel ID to get messages for
   * @param limit Maximum number of messages to return
   * @param offset Number of messages to skip
   * @returns Array of messages
   */
  async getChannelMessages(channelId: string, limit = 50, offset = 0): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('id, channel_id, user_id, content, created_at, updated_at')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single message by ID
   * @param messageId The message ID to look up
   * @returns The message if found, null otherwise
   */
  async getMessageById(messageId: string): Promise<Message | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('id, channel_id, user_id, content, created_at, updated_at')
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new message
   * @param params Message creation parameters
   * @returns The created message
   */
  async createMessage(params: CreateMessageParams): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert([params])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing message
   * @param messageId The ID of the message to update
   * @param params Message update parameters
   * @returns The updated message
   */
  async updateMessage(messageId: string, params: UpdateMessageParams): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .update(params)
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a message
   * @param messageId The ID of the message to delete
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  }
} 