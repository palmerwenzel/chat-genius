import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInput } from "@/components/messages/MessageInput";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

// TODO: Day 4-5 - Implement real-time thread messaging
// - Add thread message subscription
// - Implement optimistic updates
// - Add typing indicators
// - Add message status (sent, delivered, read)

interface ThreadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string;
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

export function ThreadSidebar({ isOpen, onClose, threadId, parentMessage }: ThreadSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Thread</SheetTitle>
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
          {/* TODO: Day 4-5 - Add thread message list component */}
          <div className="space-y-4">
            {!threadId && (
              <div className="text-center text-muted-foreground py-8">
                No messages in this thread yet
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <MessageInput 
            placeholder="Reply to thread..."
            disabled={!threadId}
            // TODO: Day 4-5 - Add thread message handlers
            // onSendMessage={handleSendThreadMessage}
            // onUploadFile={handleUploadThreadFile}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
} 