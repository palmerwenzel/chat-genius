'use client';

import { create } from 'zustand';
import type { Database } from '@/types/supabase';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import { handleSupabaseError } from '@/utils/supabase/helpers';

type Channel = Database['public']['Tables']['channels']['Row'] & {
  unread_count?: number;
  category?: string;
  group_id: string;
};

interface ChannelState {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: Error | null;
  initialized: boolean;
  fetchChannels: (groupId: string) => Promise<void>;
  getChannelByName: (groupId: string, channelName: string) => Promise<Channel | null>;
  createChannel: (groupId: string, data: { 
    name: string; 
    description?: string; 
    category?: string;
    is_public?: boolean;
  }) => Promise<void>;
  updateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  setCurrentChannel: (channel: Channel | null) => void;
}

/**
 * Global channel store using Zustand
 * Manages channel state and provides channel operations
 */
export const useChannel = create<ChannelState>((set, get) => {
  const supabase = createBrowserSupabaseClient();

  return {
    channels: [],
    currentChannel: null,
    isLoading: false,
    error: null,
    initialized: false,

    fetchChannels: async (groupId: string) => {
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await supabase
          .from('channels')
          .select(`
            *,
            unread_count:channel_messages(count)
          `)
          .eq('group_id', groupId)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;
        set({ channels: data as Channel[], isLoading: false });
      } catch (error) {
        console.error('Error fetching channels:', handleSupabaseError(error));
        set({ error: error as Error, isLoading: false });
      }
    },

    getChannelByName: async (groupId: string, channelName: string) => {
      try {
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('group_id', groupId)
          .eq('name', channelName)
          .single();

        if (error) throw error;
        return data as Channel;
      } catch (error) {
        console.error('Error fetching channel:', handleSupabaseError(error));
        return null;
      }
    },

    createChannel: async (groupId: string, data) => {
      set({ isLoading: true, error: null });
      try {
        const { error } = await supabase
          .from('channels')
          .insert([{
            group_id: groupId,
            name: data.name,
            description: data.description,
            category: data.category,
            is_public: data.is_public ?? true,
          }]);

        if (error) throw error;
        // Refresh channel list
        await get().fetchChannels(groupId);
      } catch (error) {
        console.error('Error creating channel:', handleSupabaseError(error));
        set({ error: error as Error, isLoading: false });
        throw error;
      }
    },

    updateChannel: async (channelId: string, data) => {
      set({ isLoading: true, error: null });
      try {
        const { error } = await supabase
          .from('channels')
          .update(data)
          .eq('id', channelId);

        if (error) throw error;
        // Refresh channel list
        const channel = get().channels.find(c => c.id === channelId);
        if (channel?.group_id) {
          await get().fetchChannels(channel.group_id);
        }
      } catch (error) {
        console.error('Error updating channel:', handleSupabaseError(error));
        set({ error: error as Error, isLoading: false });
        throw error;
      }
    },

    deleteChannel: async (channelId: string) => {
      set({ isLoading: true, error: null });
      try {
        const { error } = await supabase
          .from('channels')
          .delete()
          .eq('id', channelId);

        if (error) throw error;
        // Remove from local state
        set(state => ({
          channels: state.channels.filter(c => c.id !== channelId),
          currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error deleting channel:', handleSupabaseError(error));
        set({ error: error as Error, isLoading: false });
        throw error;
      }
    },

    setCurrentChannel: (channel) => {
      set({ currentChannel: channel });
    },
  };
});

// Initialize realtime subscription
const supabase = createBrowserSupabaseClient();

// Subscribe to channel changes
supabase.channel('channel_changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'channels' },
    async (payload) => {
      const state = useChannel.getState();
      const channel = payload.new as Channel;
      
      // Only refresh if we have channels loaded and the changed channel belongs to the current group
      if (state.channels.length > 0 && channel.group_id === state.channels[0]?.group_id) {
        await state.fetchChannels(channel.group_id);
      }
    }
  )
  .subscribe(); 