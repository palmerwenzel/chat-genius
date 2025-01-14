import { getChannelMembers } from '@/app/(chat)/chat/[groupId]/[channelId]/actions';
import { ChannelSidebar } from './client';

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