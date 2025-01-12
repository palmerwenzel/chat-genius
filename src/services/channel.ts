import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

export type Channel = Database['public']['Tables']['channels']['Row'];
export type ChannelInsert = Database['public']['Tables']['channels']['Insert'];
export type Group = Database['public']['Tables']['groups']['Row'];

// Cache for channel data
const channelCache = new Map<string, Channel>();
const channelNameCache = new Map<string, string>(); // groupId:name -> channelId

class ChannelService {
  private readonly DEFAULT_CACHE_TIME = 1000 * 60 * 5; // 5 minutes

  /**
   * Get a channel by ID, with caching
   */
  async getChannelById(channelId: string): Promise<Channel | null> {
    // Check cache first
    const cached = channelCache.get(channelId);
    if (cached) return cached;

    const { data: channel, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();

    if (error) {
      console.error('Error fetching channel:', error);
      return null;
    }

    if (channel) {
      this.setCacheItem(channel);
    }

    return channel;
  }

  /**
   * Get a channel by name within a group
   */
  async getChannelByName(groupId: string, channelName: string): Promise<Channel | null> {
    // Check name cache first
    const cacheKey = `${groupId}:${channelName}`;
    const cachedId = channelNameCache.get(cacheKey);
    if (cachedId) {
      const channel = await this.getChannelById(cachedId);
      if (channel) return channel;
    }

    const { data: channel, error } = await supabase
      .from('channels')
      .select('*')
      .eq('group_id', groupId)
      .eq('name', channelName)
      .single();

    if (error) {
      console.error('Error fetching channel by name:', error);
      return null;
    }

    if (channel) {
      this.setCacheItem(channel);
    }

    return channel;
  }

  /**
   * Get the URL path for a channel
   */
  async getChannelPath(channelId: string): Promise<string | null> {
    const channel = await this.getChannelById(channelId);
    if (!channel) return null;

    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', channel.group_id)
      .single();

    if (!group) return null;

    return `/chat/${group.name}/${channel.name}`;
  }

  /**
   * Get a channel from a URL path
   */
  async getChannelFromPath(groupName: string, channelName: string): Promise<Channel | null> {
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('name', groupName)
      .single();

    if (!group) return null;

    return this.getChannelByName(group.id, channelName);
  }

  /**
   * Create a new channel
   */
  async createChannel(groupId: string, data: {
    name: string;
    description?: string;
    visibility?: 'public' | 'private';
    type?: 'text' | 'voice';
  }): Promise<Channel | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if channel name exists in this group
    const existing = await this.getChannelByName(groupId, data.name);
    if (existing) {
      throw new Error('Channel name already exists in this group');
    }

    const channel: ChannelInsert = {
      name: data.name,
      description: data.description,
      visibility: data.visibility || 'private',
      type: data.type || 'text',
      group_id: groupId,
      created_by: user.id,
    };

    const { data: newChannel, error } = await supabase
      .from('channels')
      .insert(channel)
      .select()
      .single();

    if (error) {
      console.error('Error creating channel:', error);
      return null;
    }

    if (newChannel) {
      this.setCacheItem(newChannel);
    }

    return newChannel;
  }

  /**
   * Update a channel
   */
  async updateChannel(channelId: string, data: {
    name?: string;
    description?: string;
    visibility?: 'public' | 'private';
  }): Promise<Channel | null> {
    const { data: updatedChannel, error } = await supabase
      .from('channels')
      .update(data)
      .eq('id', channelId)
      .select()
      .single();

    if (error) {
      console.error('Error updating channel:', error);
      return null;
    }

    if (updatedChannel) {
      this.setCacheItem(updatedChannel);
    }

    return updatedChannel;
  }

  /**
   * Delete a channel
   */
  async deleteChannel(channelId: string): Promise<boolean> {
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId);

    if (error) {
      console.error('Error deleting channel:', error);
      return false;
    }

    // Clear from cache
    this.clearCacheItem(channelId);

    return true;
  }

  /**
   * Cache management
   */
  private setCacheItem(channel: Channel) {
    channelCache.set(channel.id, channel);
    channelNameCache.set(`${channel.group_id}:${channel.name}`, channel.id);

    // Set cache expiry
    setTimeout(() => {
      this.clearCacheItem(channel.id);
    }, this.DEFAULT_CACHE_TIME);
  }

  private clearCacheItem(channelId: string) {
    const channel = channelCache.get(channelId);
    if (channel) {
      channelCache.delete(channelId);
      channelNameCache.delete(`${channel.group_id}:${channel.name}`);
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    channelCache.clear();
    channelNameCache.clear();
  }
}

// Export a singleton instance
export const channelService = new ChannelService(); 