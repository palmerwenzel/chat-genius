import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';
import { RATE_LIMITS, type RateLimitKey, type RateLimitAction } from './constants/limits';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export type RateLimitKey = 'messages' | 'reactions' | 'files' | 'threads';
export type RateLimitAction = 'create' | 'update' | 'delete' | 'toggle';

/**
 * Check if an action is within rate limits
 */
export async function checkRateLimit(
  userId: string,
  key: RateLimitKey,
  action: RateLimitAction
): Promise<RateLimitInfo> {
  const limit = RATE_LIMITS[key][action as keyof typeof RATE_LIMITS[RateLimitKey]];
  const now = Date.now();
  const windowKey = `ratelimit:${userId}:${key}:${action}:${Math.floor(now / 60000)}`;

  try {
    // Use Redis MULTI to ensure atomic operations
    const multi = redis.multi();
    
    // Add current timestamp to sorted set
    multi.zadd(windowKey, { score: now, member: now.toString() });
    
    // Remove timestamps outside current window
    multi.zremrangebyscore(windowKey, 0, now - 60000);
    
    // Get current count
    multi.zcard(windowKey);
    
    // Set expiry
    multi.expire(windowKey, 60);

    const [,, count] = await multi.exec();
    const remaining = Math.max(0, limit - (count as number));

    return {
      remaining,
      reset: Math.ceil(now / 60000) * 60000,
      limit,
    };
  } catch (error) {
    logger.error('rate-limit.check', error, { userId, key, action });
    // On error, allow the request but log it
    return {
      remaining: 1,
      reset: Math.ceil(now / 60000) * 60000,
      limit,
    };
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  return {
    'X-RateLimit-Limit': info.limit.toString(),
    'X-RateLimit-Remaining': info.remaining.toString(),
    'X-RateLimit-Reset': info.reset.toString(),
  };
} 