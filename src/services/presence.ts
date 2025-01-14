import { getSupabaseClient } from '@/lib/supabase/supabase';

export type PresenceStatus = 'online' | 'offline' | 'idle' | 'dnd';

interface PresenceRecord {
  status: PresenceStatus;
}

export class PresenceService {
  private static instance: PresenceService;
  private channelSubscriptions: Map<string, () => void> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): PresenceService {
    if (!PresenceService.instance) {
      PresenceService.instance = new PresenceService();
    }
    return PresenceService.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;
    
    // Set initial online status
    await this.updateStatus('online');
    
    // Subscribe to user's own presence
    const unsubscribe = this.subscribeToUserStatus(userId, () => {
      // Handle any presence updates
    });
    
    this.channelSubscriptions.set(userId, unsubscribe);
    this.initialized = true;
  }

  async updateStatus(status: PresenceStatus): Promise<void> {
    const { data: { user } } = await getSupabaseClient().auth.getUser();
    if (!user) return;

    await getSupabaseClient()
      .from('presence')
      .upsert({
        user_id: user.id,
        status,
        last_seen: new Date().toISOString()
      });
  }

  async getUserStatus(userId: string): Promise<PresenceStatus> {
    const { data } = await getSupabaseClient()
      .from('presence')
      .select('status')
      .eq('user_id', userId)
      .single();

    return (data as PresenceRecord)?.status || 'offline';
  }

  subscribeToUserStatus(userId: string, callback: (status: PresenceStatus) => void): () => void {
    const channel = getSupabaseClient()
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'presence',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            callback((payload.new as PresenceRecord).status);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  async cleanup(): Promise<void> {
    // Set status to offline before cleanup
    await this.updateStatus('offline');
    
    // Unsubscribe from all channels
    this.channelSubscriptions.forEach(unsubscribe => unsubscribe());
    this.channelSubscriptions.clear();
    this.initialized = false;
  }
}

// Export a singleton instance
export const presenceService = PresenceService.getInstance(); 