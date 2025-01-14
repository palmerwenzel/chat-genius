import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase/supabase';
import { Database } from '@/types/supabase';

type Table = keyof Database['public']['Tables'];
type Schema = keyof Database;
type TableRecord<T extends Table> = Database['public']['Tables'][T]['Row'];

interface SubscriptionConfig<T extends Table> {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: Schema;
  table: T;
  filter?: string;
}

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  /**
   * Subscribe to database changes
   */
  async subscribe<T extends Table>(
    config: SubscriptionConfig<T>,
    callback: (payload: RealtimePostgresChangesPayload<TableRecord<T>>) => void
  ): Promise<string> {
    const channelId = this.generateChannelId(config);
    
    if (this.channels.has(channelId)) {
      console.warn(`Channel ${channelId} already exists`);
      return channelId;
    }

    const channel = supabase
      .channel(channelId)
      .on<TableRecord<T>>(
        'postgres_changes' as 'system',
        {
          event: config.event,
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug(`Subscribed to ${channelId}`);
          this.retryAttempts.delete(channelId);
        } else if (status === 'CLOSED') {
          this.handleDisconnect(channelId, config, callback);
        }
      });

    this.channels.set(channelId, channel);
    return channelId;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(channelId);
      this.retryAttempts.delete(channelId);
    }
  }

  /**
   * Handle channel disconnection with retry logic
   */
  private async handleDisconnect<T extends Table>(
    channelId: string,
    config: SubscriptionConfig<T>,
    callback: (payload: RealtimePostgresChangesPayload<TableRecord<T>>) => void
  ): Promise<void> {
    const attempts = this.retryAttempts.get(channelId) || 0;
    
    if (attempts < this.maxRetries) {
      this.retryAttempts.set(channelId, attempts + 1);
      console.warn(`Channel ${channelId} disconnected. Retrying... (${attempts + 1}/${this.maxRetries})`);
      
      setTimeout(async () => {
        await this.unsubscribe(channelId);
        await this.subscribe(config, callback);
      }, this.retryDelay * Math.pow(2, attempts));
    } else {
      console.error(`Channel ${channelId} failed to reconnect after ${this.maxRetries} attempts`);
      this.channels.delete(channelId);
      this.retryAttempts.delete(channelId);
    }
  }

  /**
   * Generate a unique channel ID based on subscription config
   */
  private generateChannelId<T extends Table>(config: SubscriptionConfig<T>): string {
    const parts = [
      config.schema || 'public',
      config.table,
      config.event,
      config.filter || 'all'
    ];
    return `realtime:${parts.join(':')}`;
  }

  /**
   * Get all active channel IDs
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Check if a channel is active
   */
  isChannelActive(channelId: string): boolean {
    return this.channels.has(channelId);
  }
}

// Export a singleton instance
export const realtimeManager = new RealtimeManager(); 