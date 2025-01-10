import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabase = createClientComponentClient<Database>();

// Rate limits per minute
const RATE_LIMITS = {
  messages: {
    create: 60,    // 1 message per second
    update: 30,    // 1 update per 2 seconds
    delete: 30,    // 1 delete per 2 seconds
  },
  channels: {
    create: 10,    // 10 channels per minute
    update: 30,    // 1 update per 2 seconds
    delete: 10,    // 10 deletes per minute
  },
  reactions: {
    create: 120,   // 2 reactions per second
    delete: 120,   // 2 reaction removals per second
  },
  files: {
    upload: 30,    // 1 upload per 2 seconds
    delete: 30,    // 1 delete per 2 seconds
  },
} as const;

// Storage quotas in bytes
const STORAGE_QUOTAS = {
  attachments: 1024 * 1024 * 1024,    // 1GB per user
  avatars: 10 * 1024 * 1024,          // 10MB per user
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;
export type RateLimitAction = keyof (typeof RATE_LIMITS)[RateLimitKey];
export type StorageQuotaKey = keyof typeof STORAGE_QUOTAS;

interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

class LimitsService {
  private rateLimitKeys = new Map<string, Set<number>>();

  /**
   * Check if an action is within rate limits
   */
  async checkRateLimit(
    userId: string,
    key: RateLimitKey,
    action: RateLimitAction
  ): Promise<RateLimitInfo> {
    const limit = RATE_LIMITS[key][action as keyof typeof RATE_LIMITS[RateLimitKey]];
    const now = Date.now();
    const windowKey = `${userId}:${key}:${action}:${Math.floor(now / 60000)}`;
    
    // Get or create timestamp set for this window
    if (!this.rateLimitKeys.has(windowKey)) {
      this.rateLimitKeys.set(windowKey, new Set());
      
      // Cleanup old windows after 1 minute
      setTimeout(() => {
        this.rateLimitKeys.delete(windowKey);
      }, 60000);
    }

    const timestamps = this.rateLimitKeys.get(windowKey)!;
    const remaining = limit - timestamps.size;

    // Add current timestamp if within limits
    if (remaining > 0) {
      timestamps.add(now);
    }

    return {
      remaining: Math.max(0, remaining),
      reset: Math.ceil(now / 60000) * 60000,
      limit,
    };
  }

  /**
   * Check storage quota for a user
   */
  async checkStorageQuota(
    userId: string,
    bucket: StorageQuotaKey,
    additionalBytes: number
  ): Promise<boolean> {
    const quota = STORAGE_QUOTAS[bucket];

    // Get current usage
    const { data: usage, error } = await supabase
      .from('file_metadata')
      .select('size')
      .eq('uploaded_by', userId)
      .eq('bucket', bucket);

    if (error) {
      console.error('Error checking storage quota:', error);
      return false;
    }

    const currentUsage = usage.reduce((total, file) => total + file.size, 0);
    return (currentUsage + additionalBytes) <= quota;
  }

  /**
   * Get current storage usage for a user
   */
  async getStorageUsage(
    userId: string,
    bucket: StorageQuotaKey
  ): Promise<{ used: number; total: number }> {
    const { data: usage, error } = await supabase
      .from('file_metadata')
      .select('size')
      .eq('uploaded_by', userId)
      .eq('bucket', bucket);

    if (error) {
      console.error('Error getting storage usage:', error);
      return { used: 0, total: STORAGE_QUOTAS[bucket] };
    }

    const used = usage.reduce((total, file) => total + file.size, 0);
    return {
      used,
      total: STORAGE_QUOTAS[bucket],
    };
  }

  /**
   * Get rate limit headers for response
   */
  getRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
    return {
      'X-RateLimit-Limit': info.limit.toString(),
      'X-RateLimit-Remaining': info.remaining.toString(),
      'X-RateLimit-Reset': info.reset.toString(),
    };
  }
}

// Export a singleton instance
export const limitsService = new LimitsService(); 