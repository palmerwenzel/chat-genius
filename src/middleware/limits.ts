import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { limitsService } from '@/services/limits';
import type { RateLimitKey, RateLimitAction, StorageQuotaKey } from '@/services/limits';

/**
 * Check rate limits for an API route
 */
export async function withRateLimit(
  request: NextRequest,
  userId: string,
  key: RateLimitKey,
  action: RateLimitAction
) {
  const info = await limitsService.checkRateLimit(userId, key, action);
  
  if (info.remaining <= 0) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...limitsService.getRateLimitHeaders(info),
        },
      }
    );
  }

  // Add rate limit headers to successful response
  const response = await request;
  Object.entries(limitsService.getRateLimitHeaders(info)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Check storage quota for file uploads
 */
export async function withStorageQuota(
  request: NextRequest,
  userId: string,
  bucket: StorageQuotaKey,
  fileSize: number
) {
  const hasQuota = await limitsService.checkStorageQuota(userId, bucket, fileSize);
  
  if (!hasQuota) {
    return new NextResponse(
      JSON.stringify({
        error: 'Storage Quota Exceeded',
        message: 'Not enough storage space',
      }),
      {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return request;
}

/**
 * Example usage in an API route:
 * 
 * export async function POST(request: NextRequest) {
 *   const userId = await getUserId(request);
 *   
 *   // Check rate limit
 *   const limitCheck = await withRateLimit(request, userId, 'messages', 'create');
 *   if (limitCheck instanceof NextResponse) return limitCheck;
 *   
 *   // If uploading a file, check quota
 *   if (file) {
 *     const quotaCheck = await withStorageQuota(request, userId, 'attachments', file.size);
 *     if (quotaCheck instanceof NextResponse) return quotaCheck;
 *   }
 *   
 *   // Process the request...
 * }
 */ 