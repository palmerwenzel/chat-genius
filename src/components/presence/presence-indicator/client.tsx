'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type { PresenceStatus } from '../actions';

const statusConfig = {
  online: { color: 'bg-green-500', label: 'Online' },
  idle: { color: 'bg-yellow-500', label: 'Idle' },
  dnd: { color: 'bg-red-500', label: 'Do Not Disturb' },
  offline: { color: 'bg-gray-500', label: 'Offline' },
} as const;

interface PresenceIndicatorProps {
  userId: string;
  initialStatus?: PresenceStatus;
  className?: string;
  showTooltip?: boolean;
}

export function PresenceIndicator({ 
  userId, 
  initialStatus = 'offline', 
  className,
  showTooltip = true,
}: PresenceIndicatorProps) {
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

  const indicator = (
    <div
      className={cn(
        "h-2.5 w-2.5 rounded-full border-2 border-background",
        statusConfig[status].color,
        className
      )}
    />
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <TooltipPrimitive.Root>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs bg-background">
          {statusConfig[status].label}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
} 