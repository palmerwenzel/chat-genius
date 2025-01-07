import * as React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Smile, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageActionsProps {
  messageId: string;
  hasThread?: boolean;
  replyCount?: number;
  onThreadClick?: () => void;
  onReactionClick?: () => void;
}

export function MessageActions({
  messageId,
  hasThread,
  replyCount = 0,
  onThreadClick,
  onReactionClick,
}: MessageActionsProps) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-accent"
        onClick={onReactionClick}
      >
        <Smile className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 hover:bg-accent flex items-center gap-1"
        onClick={onThreadClick}
      >
        <MessageSquare className="h-4 w-4" />
        {replyCount > 0 && <span className="text-xs">{replyCount}</span>}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 