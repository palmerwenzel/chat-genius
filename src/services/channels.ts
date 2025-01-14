import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateChannelParams {
  name: string;
  description: string | null;
  created_by: string;
}

export class ChannelService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get a channel by its name
   * @param name The channel name to look up
   * @returns The channel if found, null otherwise
   */
  async getChannelByName(name: string): Promise<Channel | null> {
    const { data, error } = await this.supabase
      .from('channels')
      .select('id, name, description, created_at, updated_at, created_by')
      .eq('name', name)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get a channel by its ID
   * @param id The channel ID to look up
   * @returns The channel if found, null otherwise
   */
  async getChannelById(id: string): Promise<Channel | null> {
    const { data, error } = await this.supabase
      .from('channels')
      .select('id, name, description, created_at, updated_at, created_by')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get the first available channel, ordered by name
   * @returns The first channel if any exist, null otherwise
   */
  async getFirstChannel(): Promise<Channel | null> {
    const { data, error } = await this.supabase
      .from('channels')
      .select(`
        id, 
        name, 
        description, 
        created_at, 
        updated_at, 
        created_by,
        channel_members!inner (
          user_id
        )
      `)
      .order('name')
      .limit(1);

    // If no channels exist, data will be an empty array
    if (error || !data?.length) return null;
    return data[0];
  }

  /**
   * Get all channels, ordered by name
   * @returns Array of all channels
   */
  async getAllChannels(): Promise<Channel[]> {
    const { data, error } = await this.supabase
      .from('channels')
      .select(`
        id, 
        name, 
        description, 
        created_at, 
        updated_at, 
        created_by,
        channel_members!inner (
          user_id
        )
      `)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new channel
   * @param params Channel creation parameters
   * @returns The created channel
   */
  async createChannel(params: CreateChannelParams): Promise<Channel> {
    const { data, error } = await this.supabase
      .from('channels')
      .insert([params])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 