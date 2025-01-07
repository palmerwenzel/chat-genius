import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface EmojiReactionsProps {
  reactions: Reaction[];
  currentUserId: string;
  onReact: (emoji: string) => void;
}

const commonEmojis = ["👍", "❤️", "😂", "🎉", "🤔", "👀", "🚀", "✨"];

export function EmojiReactions({ reactions, currentUserId, onReact }: EmojiReactionsProps) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs gap-1 hover:bg-muted",
            reaction.users.includes(currentUserId) && "bg-muted"
          )}
          onClick={() => onReact(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <ScrollArea className="h-32">
            <div className="grid grid-cols-8 gap-1">
              {commonEmojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => onReact(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
} 