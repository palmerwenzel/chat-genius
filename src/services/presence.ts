import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { debounce } from 'lodash';

export type PresenceStatus = 'online' | 'offline' | 'idle' | 'dnd';

class PresenceService {
  private supabase = createClientComponentClient<Database>();
  private activityTimeout: number = 5 * 60 * 1000; // 5 minutes
  private idleTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private userId: string | null = null;

  /**
   * Initialize presence tracking for a user
   */
  async initialize(userId: string) {
    this.userId = userId;

    // Set initial online status
    await this.updateStatus('online');

    // Set up activity listeners
    this.setupActivityTracking();

    // Set up page visibility tracking
    this.setupVisibilityTracking();

    // Set up beforeunload tracking
    this.setupBeforeUnload();
  }

  /**
   * Update user's presence status
   */
  async updateStatus(status: PresenceStatus) {
    if (!this.userId) return;

    try {
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
   * Update user's typing status in a channel
   */
  updateTypingStatus = debounce(async (channelId: string, isTyping: boolean) => {
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
  }, 500);

  /**
   * Set up activity tracking
   */
  private setupActivityTracking() {
    const updateActivity = () => {
      this.lastActivity = Date.now();
      
      // Clear existing timer
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }

      // Set new timer
      this.idleTimer = setTimeout(async () => {
        const currentStatus = await this.getCurrentStatus();
        if (currentStatus === 'online') {
          await this.updateStatus('idle');
        }
      }, this.activityTimeout);
    };

    // Track user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
  }

  /**
   * Set up page visibility tracking
   */
  private setupVisibilityTracking() {
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        const currentStatus = await this.getCurrentStatus();
        if (currentStatus === 'online') {
          await this.updateStatus('idle');
        }
      } else {
        await this.updateStatus('online');
      }
    });
  }

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
  private async getCurrentStatus(): Promise<PresenceStatus> {
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
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    if (this.userId) {
      await this.updateStatus('offline');
    }
  }
}

// Export a singleton instance
export const presenceService = new PresenceService(); 