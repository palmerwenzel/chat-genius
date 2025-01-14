import { getSupabaseServer } from '@/lib/supabase/server';
import { StatusSelector as StatusSelectorClient } from './client';
import { updatePresenceStatus } from '../actions';
import type { PresenceStatus } from '../actions';

interface StatusSelectorProps {
  userId: string;
}

export async function StatusSelector({ userId }: StatusSelectorProps) {
  const supabase = getSupabaseServer();

  // Get initial status
  const { data } = await supabase
    .from('presence')
    .select('status')
    .eq('user_id', userId)
    .single();

  const initialStatus = (data?.status || 'online') as PresenceStatus;

  return (
    <StatusSelectorClient
      userId={userId}
      initialStatus={initialStatus}
      onStatusChange={updatePresenceStatus}
    />
  );
} 