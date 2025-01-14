import { MemberManagementClient } from './client';

interface MemberManagementProps {
  channelId: string;
  currentUserId: string;
}

export function MemberManagement(props: MemberManagementProps) {
  return <MemberManagementClient {...props} />;
} 