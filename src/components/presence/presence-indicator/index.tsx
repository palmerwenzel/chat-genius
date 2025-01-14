'use client';

import { useEffect, useState } from 'react';
import { Circle, MinusCircle, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type { PresenceStatus } from '../actions';

const statusConfig = {
  online: { icon: Circle, color: 'text-green-500' },
  idle: { icon: Moon, color: 'text-yellow-500' },
  dnd: { icon: MinusCircle, color: 'text-red-500' },
  offline: { icon: Circle, color: 'text-gray-500' },
} as const;

interface PresenceIndicatorProps {
  userId: string;
  initialStatus?: PresenceStatus;
  className?: string;
}

export function PresenceIndicator({ userId, initialStatus = 'offline', className }: PresenceIndicatorProps) {
  const [status, setStatus] = useState<PresenceStatus>(initialStatus);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase.channel('presence-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'presence',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new && 'status' in payload.new) {
          setStatus(payload.new.status as PresenceStatus);
        }
      })
      .subscribe();

    setIsSubscribed(true);

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, userId, isSubscribed]);

  const StatusIcon = statusConfig[status].icon;

  return (
    <StatusIcon 
      className={cn("h-3 w-3", statusConfig[status].color, className)} 
      title={status}
    />
  );
} 