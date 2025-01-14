'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { logger } from '@/lib/logger';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { PresenceStatus, PresenceRecord } from '@/types/presence';

type PresenceCallback = (status: PresenceStatus) => void;

class PresenceManager {
  private static instance: PresenceManager;
  private channelSubscriptions: Map<string, () => void>;
  private initialized: boolean;
  private supabase;

  private constructor() {
    this.channelSubscriptions = new Map();
    this.initialized = false;
    this.supabase = createClientComponentClient<Database>();
  }

  static getInstance(): PresenceManager {
    if (!PresenceManager.instance) {
      PresenceManager.instance = new PresenceManager();
    }
    return PresenceManager.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Set initial online status
      await this.updateStatus('online');
      
      // Subscribe to user's own presence
      const unsubscribe = this.subscribeToUserStatus(userId, () => {
        // Handle any presence updates
        logger.info('presence.self.updated', { userId });
      });
      
      this.channelSubscriptions.set(userId, unsubscribe);
      this.initialized = true;
    } catch (error) {
      logger.error('presence.initialize', error as Error, { userId });
      throw error;
    }
  }

  private async updateStatus(status: PresenceStatus): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { error } = await this.supabase
        .from('presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('presence.updateStatus', error as Error, { status });
      throw error;
    }
  }

  subscribeToUserStatus(userId: string, callback: PresenceCallback): () => void {
    try {
      const subscription = this.supabase
        .channel(`presence:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'presence',
            filter: `user_id=eq.${userId}`
          },
          (payload: RealtimePostgresChangesPayload<PresenceRecord>) => {
            if (!payload.new || !('status' in payload.new)) return;
            callback(payload.new.status);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('presence.subscribed', { userId });
          }
        });

      return () => {
        subscription.unsubscribe();
        logger.info('presence.unsubscribed', { userId });
      };
    } catch (error) {
      logger.error('presence.subscribe', error as Error, { userId });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Set status to offline before cleanup
      await this.updateStatus('offline');
      
      // Unsubscribe from all channels
      this.channelSubscriptions.forEach(unsubscribe => unsubscribe());
      this.channelSubscriptions.clear();
      this.initialized = false;
    } catch (error) {
      logger.error('presence.cleanup', error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const presenceManager = PresenceManager.getInstance(); 