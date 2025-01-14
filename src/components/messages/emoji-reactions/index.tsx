import { Button } from "@/components/ui/button";
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

export function EmojiReactions({ reactions, currentUserId, onReact }: EmojiReactionsProps) {

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs gap-1 hover:bg-muted/50 border",
            reaction.users.includes(currentUserId) ? "bg-muted/50 border-blue-500/50" : "bg-muted/15 border-transparent"
          )}
          onClick={() => onReact(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}
    </div>
  );
} 