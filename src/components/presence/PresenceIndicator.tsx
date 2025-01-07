import * as React from "react";
import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export type PresenceStatus = 'online' | 'offline' | 'idle' | 'dnd';

interface PresenceIndicatorProps {
  status: PresenceStatus;
  className?: string;
  showTooltip?: boolean;
}

const statusConfig = {
  online: {
    color: "bg-green-500",
    label: "Online",
  },
  offline: {
    color: "bg-gray-500",
    label: "Offline",
  },
  idle: {
    color: "bg-yellow-500",
    label: "Idle",
  },
  dnd: {
    color: "bg-red-500",
    label: "Do Not Disturb",
  },
} as const;

export function PresenceIndicator({ 
  status, 
  className,
  showTooltip = true,
}: PresenceIndicatorProps) {
  const config = statusConfig[status];
  
  const indicator = (
    <div
      className={cn(
        "h-2.5 w-2.5 rounded-full border-2 border-background",
        config.color,
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
        <TooltipContent 
          side="top" 
          className="text-xs bg-background"
        >
          {config.label}
        </TooltipContent>
      </TooltipPrimitive.Root>
    </TooltipProvider>
  );
} 