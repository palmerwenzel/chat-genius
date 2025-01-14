import type { Database } from '@/types/supabase';

export type Channel = Database['public']['Tables']['channels']['Row'];
export type ChannelInsert = Database['public']['Tables']['channels']['Insert'];

export interface ChannelWithMembers extends Channel {
  members: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  }[];
}

export interface ChannelWithGroup extends Channel {
  group: {
    id: string;
    name: string;
    description: string | null;
  };
} 