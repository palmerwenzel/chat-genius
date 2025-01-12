import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInput } from "@/components/messages/MessageInput";
import { Button } from "@/components/ui/button";
import { X, Reply } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import { Message } from "@/components/messages/Message";
import { Database } from "@/types/supabase";
import { storageService } from "@/services/storage";

type MessageType = Database['public']['Tables']['messages']['Row'] & {
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
  thread_id?: string;
  replying_to_id?: string;
  metadata?: {
    files?: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
    }>;
  };
};

interface ThreadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string;
  channelId: string;
  parentMessage?: {
    id: string;
    content: string;
    author: {
      name: string;
      avatar?: string;
    };
    timestamp: string;
  };
}

export function ThreadSidebar({ isOpen, onClose, threadId, channelId, parentMessage }: ThreadSidebarProps) {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState<{ id: string; content: string; author: string } | undefined>(undefined);
  const messageInputRef = React.useRef<{ focus: () => void }>(null);

  // Focus input when replying
  React.useEffect(() => {
    if (replyTo) {
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    }
  }, [replyTo]);

  // Load thread messages
  const loadThreadMessages = React.useCallback(async () => {
    if (!threadId) return;
    
    try {
      setIsLoading(true);
      
      // Load all messages in this thread
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users(
            id,
            name,
            avatar_url,
            email
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as MessageType[]);
      }
    } catch (error) {
      console.error('Error loading thread messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  // Handle sending a new thread message
  const handleSendThreadMessage = React.useCallback(async (
    content: string, 
    type: 'text' | 'code' = 'text',
    attachments?: File[],
    replyTo?: { id: string; content: string; author: string }
  ) => {
    if (!threadId || !user) return;

    try {
      // First create the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          content,
          type,
          thread_id: threadId,
          sender_id: user.id,
          channel_id: channelId,
          replying_to_id: replyTo?.id,
          metadata: attachments ? { 
            files: attachments.map(file => ({
              name: file.name,
              size: file.size,
              type: file.type
            }))
          } : {}
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // If there are attachments, upload them
      if (attachments?.length) {
        const uploadedFiles = await Promise.all(
          attachments.map(async (file) => {
            const publicUrl = await storageService.uploadFile('attachments', file, {
              name: file.name,
              size: file.size,
              mimeType: file.type,
              channelId,
              messageId: message.id
            }, user.id);

            if (!publicUrl) {
              throw new Error('Failed to upload file');
            }

            return {
              url: publicUrl,
              type: file.type,
              name: file.name,
              size: file.size
            };
          })
        );

        // Update the message with file metadata
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            metadata: {
              files: uploadedFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url
              }))
            }
          })
          .eq('id', message.id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error sending thread message:', error);
    }
  }, [threadId, user, channelId]);

  // Subscribe to thread messages
  React.useEffect(() => {
    if (!threadId) return;

    // Load initial messages
    loadThreadMessages();

    // Subscribe to new messages in the thread
    const subscription = supabase
      .channel(`thread-${threadId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`
      }, async () => {
        // Reload all thread messages
        await loadThreadMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [threadId, loadThreadMessages]);

  const handleReply = React.useCallback((message: MessageType) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      author: message.sender.name
    });
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col" hideClose>
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle>Thread</SheetTitle>
              <Reply className="h-4 w-4 text-primary" />
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {parentMessage && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">{parentMessage.author.name}</span>
              <span className="text-xs text-muted-foreground">{parentMessage.timestamp}</span>
            </div>
            <p className="text-sm">{parentMessage.content}</p>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages in this thread yet
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="py-0.5">
                  <Message 
                    message={message}
                    onReply={() => handleReply(message)}
                    isThreadMessage
                    onScrollToMessage={(messageId) => {
                      const element = document.getElementById(`message-${messageId}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <MessageInput 
            ref={messageInputRef}
            placeholder="Reply to thread..."
            disabled={!threadId}
            onSend={handleSendThreadMessage}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(undefined)}
            onNavigateToMessage={(messageId) => {
              const element = document.getElementById(`message-${messageId}`);
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            channelId={channelId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
} 