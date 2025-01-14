import { getSupabaseServer } from '@/lib/supabase/supabase-server';
import { StatusSelectorClient } from './client';
import { updateStatus } from '@/components/presence/actions';
import type { PresenceStatus } from '@/types/presence';

interface StatusSelectorProps {
  userId: string;
}

export async function StatusSelector({ userId }: StatusSelectorProps) {
  const supabase = await getSupabaseServer();

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
      onStatusChange={updateStatus}
    />
  );
} 