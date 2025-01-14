import { getSupabaseServer } from '@/app/lib/supabase/server';
import { ChannelSidebar } from './client';
import { getChannelMembers } from './actions';

interface ChannelSidebarServerProps {
  groupId: string;
  channelId: string;
  className?: string;
}

export async function ChannelSidebarServer({
  groupId,
  channelId,
  className
}: ChannelSidebarServerProps) {
  // Get members with their presence data
  const members = await getChannelMembers(groupId, channelId);

  return (
    <ChannelSidebar
      members={members}
      channelId={channelId}
      className={className}
    />
  );
}

export { ChannelSidebar }; 