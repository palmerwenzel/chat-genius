import { Reply } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ParentMessagePreviewProps {
  content: string;
  author: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  onClick?: () => void;
  deleted?: boolean;
}

export function ParentMessagePreview({ content, author, onClick, deleted }: ParentMessagePreviewProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 ml-4 rounded hover:bg-muted/50 transition-colors w-full text-left group whitespace-nowrap min-w-0"
    >
      <Reply className="h-3 w-3 text-muted-foreground flex-shrink-0 scale-x-[-1]" />
      <Avatar className="h-4 w-4 flex-shrink-0">
        <AvatarImage src={author.avatar} />
        <AvatarFallback className="text-[10px]">{author.name[0]}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-xs text-muted-foreground flex-shrink-0">{author.name}</span>
      <span className="text-xs text-muted-foreground/80 truncate min-w-0">
        {deleted ? "[Original message was deleted]" : content}
      </span>
    </button>
  );
}