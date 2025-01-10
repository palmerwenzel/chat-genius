import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { realtimeManager } from '@/lib/realtime';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

type Channel = Database['public']['Tables']['channels']['Row'];
type ChannelInsert = Database['public']['Tables']['channels']['Insert'];
type ChannelMember = Database['public']['Tables']['channel_members']['Row'];
type MemberRole = 'owner' | 'admin' | 'member';

interface CreateChannelData {
  name: string;
  type?: 'text' | 'voice';
  is_public?: boolean;
  description?: string;
}

interface UpdateChannelData {
  name?: string;
  description?: string;
  is_public?: boolean;
}

class ChannelService {
  /**
   * Create a new channel
   */
  async createChannel(data: CreateChannelData): Promise<Channel | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const channel: ChannelInsert = {
      name: data.name,
      type: data.type || 'text',
      is_public: data.is_public ?? false,
      description: data.description,
      owner_id: user.id,
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

    // Add creator as owner
    await this.addMember(newChannel.id, user.id, 'owner');

    return newChannel;
  }

  /**
   * Get a channel by ID
   */
  async getChannel(channelId: string): Promise<Channel | null> {
    const { data: channel, error } = await supabase
      .from('channels')
      .select()
      .eq('id', channelId)
      .single();

    if (error) {
      console.error('Error fetching channel:', error);
      return null;
    }

    return channel;
  }

  /**
   * Update a channel
   */
  async updateChannel(channelId: string, data: UpdateChannelData): Promise<Channel | null> {
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

    return true;
  }

  /**
   * Get channel members
   */
  async getMembers(channelId: string): Promise<ChannelMember[]> {
    const { data: members, error } = await supabase
      .from('channel_members')
      .select('*, user:users(id, name, avatar_url, status)')
      .eq('channel_id', channelId);

    if (error) {
      console.error('Error fetching channel members:', error);
      return [];
    }

    return members;
  }

  /**
   * Add a member to a channel
   */
  async addMember(channelId: string, userId: string, role: MemberRole = 'member'): Promise<boolean> {
    const { error } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channelId,
        user_id: userId,
        role,
      });

    if (error) {
      console.error('Error adding channel member:', error);
      return false;
    }

    return true;
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(channelId: string, userId: string, role: MemberRole): Promise<boolean> {
    const { error } = await supabase
      .from('channel_members')
      .update({ role })
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating member role:', error);
      return false;
    }

    return true;
  }

  /**
   * Remove a member from a channel
   */
  async removeMember(channelId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing channel member:', error);
      return false;
    }

    return true;
  }

  /**
   * Subscribe to channel updates
   */
  async subscribeToChannel(channelId: string, callback: (channel: Channel) => void): Promise<string> {
    return realtimeManager.subscribe({
      table: 'channels',
      event: '*',
      filter: `id=eq.${channelId}`,
    }, (payload) => {
      if (payload.new) {
        callback(payload.new as Channel);
      }
    });
  }

  /**
   * Subscribe to member updates
   */
  async subscribeToMembers(channelId: string, callback: (member: ChannelMember) => void): Promise<string> {
    return realtimeManager.subscribe({
      table: 'channel_members',
      event: '*',
      filter: `channel_id=eq.${channelId}`,
    }, (payload) => {
      if (payload.new) {
        callback(payload.new as ChannelMember);
      }
    });
  }
}

// Export a singleton instance
export const channelService = new ChannelService(); 