import { CreateGroupDialog as CreateGroupDialogClient } from './client';
import { createGroup } from '../actions';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog(props: CreateGroupDialogProps) {
  return (
    <CreateGroupDialogClient
      {...props}
      onSubmit={createGroup}
    />
  );
} 