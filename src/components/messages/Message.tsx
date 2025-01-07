'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageContent } from '@/components/messages/MessageContent';
import { MessageActions } from '@/components/messages/MessageActions';
import { LinkPreview } from '@/components/messages/LinkPreview';
import { useAuth } from '@/stores/auth';
import { Database } from '@/types/supabase';

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  }
};

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const { user } = useAuth();
  const isCurrentUser = message.sender.id === user?.id;
  const urls = message.content.match(/https?:\/\/[^\s]+/g) || [];

  return (
    <div className="group flex items-start space-x-4 animate-fade-in">
      {!isCurrentUser && (
        <Avatar className="transition-transform group-hover:scale-105">
          <AvatarImage src={message.sender.avatar_url || "/placeholder.svg"} />
          <AvatarFallback>{message.sender.name?.[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className={`flex flex-col ${isCurrentUser ? 'items-end ml-auto' : 'items-start'} max-w-[80%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{message.sender.name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleString()}
          </span>
        </div>
        <div className={`
          rounded-lg w-fit
          ${message.type === 'code' ? 'bg-muted font-mono' : 'bg-primary/10 text-foreground p-3'}
          ${isCurrentUser ? 'bg-primary' : ''}
        `}>
          <MessageContent content={message.content} type={message.type || 'text'} />
        </div>

        {/* Link Previews */}
        {urls.length > 0 && message.type !== 'code' && (
          <div className="space-y-2 mt-2">
            {urls.map((url) => (
              <LinkPreview key={url} url={url} />
            ))}
          </div>
        )}

        {/* Message Actions */}
        <div className="flex items-center gap-2 mt-1">
          <MessageActions
            messageId={message.id}
            hasThread={!!message.parent_id}
            onThreadClick={() => {}}
            onReactionClick={() => {}}
          />
        </div>
      </div>
      {isCurrentUser && (
        <Avatar className="transition-transform group-hover:scale-105">
          <AvatarImage src={message.sender.avatar_url || "/placeholder.svg"} />
          <AvatarFallback>{message.sender.name?.[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
} 