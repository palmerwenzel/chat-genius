import type { Database } from '@/types/supabase';

export type PresenceStatus = 'online' | 'offline' | 'idle' | 'dnd';

export type Presence = Database['public']['Tables']['presence']['Row'];
export type PresenceInsert = Database['public']['Tables']['presence']['Insert'];

export interface PresenceRecord {
  status: PresenceStatus;
  last_seen: string;
  user_id: string;
} 