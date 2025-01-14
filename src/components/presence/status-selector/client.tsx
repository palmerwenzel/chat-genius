'use client';

import { useEffect, useState } from 'react';
import { Check, Circle, MinusCircle, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import type { PresenceStatus } from '../actions';
import type { Database } from '@/types/supabase';

const statusConfig = {
  online: { icon: Circle, color: 'text-green-500', label: 'Online' },
  idle: { icon: Moon, color: 'text-yellow-500', label: 'Idle' },
  dnd: { icon: MinusCircle, color: 'text-red-500', label: 'Do Not Disturb' },
  offline: { icon: Circle, color: 'text-gray-500', label: 'Invisible' },
} as const;

interface StatusSelectorProps {
  userId: string;
  initialStatus?: PresenceStatus;
  onStatusChange: (status: PresenceStatus) => Promise<{ error?: string; success?: boolean; message?: string }>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusSelector({ 
  userId, 
  initialStatus = 'online', 
  onStatusChange,
  className,
  size = 'md'
}: StatusSelectorProps) {
  const [status, setStatus] = useState<PresenceStatus>(initialStatus);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  // Subscribe to presence changes
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

  const handleStatusChange = async (newStatus: PresenceStatus) => {
    try {
      const result = await onStatusChange(newStatus);
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      if (result.message) {
        toast({
          title: 'Success',
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn("h-8 w-8 p-0", className)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
              >
                <StatusIcon className={cn(sizeClasses[size], statusConfig[status].color)} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent 
            align="end"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {Object.entries(statusConfig).map(([key, { icon: Icon, color, label }]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusChange(key as PresenceStatus)}
                className="flex items-center gap-2"
              >
                <Icon className={cn("h-4 w-4", color)} />
                <span>{label}</span>
                {status === key && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>
          <p>Click to change your status</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 