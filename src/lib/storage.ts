import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { logger } from '@/lib/logger';
import { STORAGE_QUOTAS, type StorageQuotaKey } from './constants/limits';

/**
 * Check storage quota for a user
 */
export async function checkStorageQuota(
  userId: string,
  bucket: StorageQuotaKey,
  additionalBytes: number
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();
    const quota = STORAGE_QUOTAS[bucket];

    // Get current usage
    const { data: usage, error } = await supabase
      .from('file_metadata')
      .select('size')
      .eq('uploaded_by', userId)
      .eq('bucket', bucket);

    if (error) {
      logger.error('storage.checkQuota', error, { userId, bucket });
      return false;
    }

    const currentUsage = usage.reduce((total, file) => total + file.size, 0);
    return (currentUsage + additionalBytes) <= quota;
  } catch (error) {
    logger.error('storage.checkQuota.unexpected', error, { userId, bucket });
    return false;
  }
}

/**
 * Get current storage usage for a user
 */
export async function getStorageUsage(
  userId: string,
  bucket: StorageQuotaKey
): Promise<{ used: number; total: number }> {
  try {
    const supabase = await getSupabaseServer();
    const { data: usage, error } = await supabase
      .from('file_metadata')
      .select('size')
      .eq('uploaded_by', userId)
      .eq('bucket', bucket);

    if (error) {
      logger.error('storage.getUsage', error, { userId, bucket });
      return { used: 0, total: STORAGE_QUOTAS[bucket] };
    }

    const used = usage.reduce((total, file) => total + file.size, 0);
    return {
      used,
      total: STORAGE_QUOTAS[bucket],
    };
  } catch (error) {
    logger.error('storage.getUsage.unexpected', error, { userId, bucket });
    return { used: 0, total: STORAGE_QUOTAS[bucket] };
  }
} 