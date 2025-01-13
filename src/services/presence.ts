import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export type PresenceStatus = 'online' | 'offline' | 'idle' | 'dnd';

class PresenceService {
  private supabase = createClientComponentClient<Database>();
  private userId: string | null = null;
  private userSetStatus: PresenceStatus | null = null;

  /**
   * Initialize presence tracking for a user
   */
  async initialize(userId: string) {
    this.userId = userId;

    // Check if user has an existing status
    const currentStatus = await this.getCurrentStatus();
    this.userSetStatus = currentStatus;

    // Set up visibility tracking
    this.setupVisibilityTracking();
    this.setupBeforeUnload();
  }

  /**
   * Update user's presence status
   */
  async updateStatus(status: PresenceStatus) {
    if (!this.userId) return;

    try {
      // Store the user-set status
      this.userSetStatus = status;

      const { error } = await this.supabase
        .from('presence')
        .update({ 
          status,
          last_active: new Date().toISOString(),
        })
        .eq('user_id', this.userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  /**
   * Set up visibility tracking
   */
  private setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Only update status if user hasn't set a custom status
        if (!this.userSetStatus || this.userSetStatus === 'offline') {
          this.updateStatus('online');
        }
      } else {
        // Only set to offline if user was previously online
        if (this.userSetStatus === 'online') {
          this.updateStatus('offline');
        }
      }
    });
  }

  /**
   * Update user's typing status in a channel
   */
  updateTypingStatus = async (channelId: string, isTyping: boolean) => {
    if (!this.userId) return;

    try {
      const { error } = await this.supabase
        .from('channel_typing')
        .upsert({
          channel_id: channelId,
          user_id: this.userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  /**
   * Set up beforeunload tracking
   */
  private setupBeforeUnload() {
    window.addEventListener('beforeunload', async () => {
      await this.updateStatus('offline');
    });
  }

  /**
   * Get current user status
   */
  async getCurrentStatus(): Promise<PresenceStatus> {
    if (!this.userId) return 'offline';

    const { data } = await this.supabase
      .from('presence')
      .select('status')
      .eq('user_id', this.userId)
      .single();

    return (data?.status as PresenceStatus) || 'offline';
  }

  /**
   * Clean up presence tracking
   */
  async cleanup() {
    if (this.userId) {
      await this.updateStatus('offline');
      this.userSetStatus = null;
    }
  }
}

// Export a singleton instance
export const presenceService = new PresenceService(); 