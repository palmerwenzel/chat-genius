import { CreateChannelDialogClient } from './client';

interface CreateChannelDialogProps {
  groupId: string;
  groupName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: string) => void;
}

export function CreateChannelDialog(props: CreateChannelDialogProps) {
  return <CreateChannelDialogClient {...props} />;
} 