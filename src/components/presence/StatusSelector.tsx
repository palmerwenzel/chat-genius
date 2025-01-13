import * as React from "react";
import {
  Circle,
  Moon,
  MinusCircle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { useAuth } from "@/stores/auth";
import { presenceService } from "@/services/presence";

export type Status = 'online' | 'idle' | 'dnd' | 'offline';

interface StatusSelectorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  online: {
    label: 'Online',
    color: 'bg-green-500',
    icon: Circle,
  },
  idle: {
    label: 'Idle',
    color: 'bg-yellow-500',
    icon: Moon,
  },
  dnd: {
    label: 'Do Not Disturb',
    color: 'bg-red-500',
    icon: MinusCircle,
  },
  offline: {
    label: 'Invisible',
    color: 'bg-gray-500',
    icon: XCircle,
  },
} as const;

export function StatusSelector({ className, size = 'md' }: StatusSelectorProps) {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = React.useState<Status>('online');
  const [isOpen, setIsOpen] = React.useState(false);
  const supabase = createClientComponentClient<Database>();

  // Fetch initial status
  React.useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('presence')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCurrentStatus(data.status as Status);
      }
    };

    fetchStatus();

    // Subscribe to presence changes
    const channel = supabase.channel('presence_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'presence',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.status) {
            setCurrentStatus(payload.new.status as Status);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, supabase]);

  const updateStatus = async (status: Status) => {
    if (!user) return;

    try {
      // Update local state immediately for better UX
      setCurrentStatus(status);
      
      // Use the presence service to update status
      await presenceService.updateStatus(status);
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert on error
      setCurrentStatus(currentStatus);
    }
  };

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const StatusIcon = statusConfig[currentStatus].icon;

  return (
    <TooltipProvider>
      <TooltipPrimitive.Root>
        <TooltipTrigger asChild>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal>
            <DropdownMenuTrigger asChild>
              <div 
                role="button" 
                className={cn("focus:outline-none cursor-pointer", className)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
              >
                <div className="relative inline-block">
                  <StatusIcon className={cn(
                    sizeClasses[size],
                    statusConfig[currentStatus].color,
                    "rounded-full"
                  )} />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              onCloseAutoFocus={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onInteractOutside={(e) => {
                e.preventDefault();
                setIsOpen(false);
              }}
              onEscapeKeyDown={() => setIsOpen(false)}
            >
              {(Object.keys(statusConfig) as Status[]).map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateStatus(status);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {React.createElement(statusConfig[status].icon, {
                    className: cn(
                      "h-4 w-4",
                      statusConfig[status].color,
                      "rounded-full"
                    )
                  })}
                  {statusConfig[status].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to change your status</p>
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
} 