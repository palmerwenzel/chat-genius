import { ChannelListClient } from './client';

interface ChannelListProps {
  groupId: string;
  groupName: string;
  onCreateChannel?: () => void;
}

export function ChannelList(props: ChannelListProps) {
  return <ChannelListClient {...props} />;
} 