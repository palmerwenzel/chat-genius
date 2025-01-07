import * as React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  users?: string[];
  className?: string;
}

export function TypingIndicator({ users = [], className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text = users.length === 1
    ? `${users[0]} is typing...`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing...`
    : users.length === 3
    ? `${users[0]}, ${users[1]}, and ${users[2]} are typing...`
    : `${users.length} people are typing...`;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className="flex gap-1">
        <span className="animate-bounce">•</span>
        <span className="animate-bounce [animation-delay:0.2s]">•</span>
        <span className="animate-bounce [animation-delay:0.4s]">•</span>
      </div>
      {text}
    </div>
  );
} 