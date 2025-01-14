import { ChannelSettingsClient } from './client';
import type { Database } from '@/types/supabase';

type Channel = Database['public']['Tables']['channels']['Row'];

interface ChannelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel;
  currentUserId: string;
}

export function ChannelSettings(props: ChannelSettingsProps) {
  return <ChannelSettingsClient {...props} />;
} 