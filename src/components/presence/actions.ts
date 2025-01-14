'use server';

import { getSupabaseServer } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { PresenceStatus, PresenceRecord } from '@/types/presence';

export async function updateStatus(status: PresenceStatus) {
  const supabase = getSupabaseServer();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('presence')
      .upsert({
        user_id: user.id,
        status,
        last_seen: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    logger.error('presence.updateStatus', error, { status });
    throw error;
  }
}

export async function getUserStatus(userId: string): Promise<PresenceStatus> {
  const supabase = getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('presence')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return (data as PresenceRecord)?.status || 'offline';
  } catch (error) {
    logger.error('presence.getUserStatus', error, { userId });
    throw error;
  }
} 