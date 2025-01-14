"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Send, Image, FileText, Reply, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { sendMessage, updateTypingStatus } from "@/app_new/(chat)/actions";

interface MessageInputProps {
  channelId: string;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    author: string;
  };
  onCancelReply?: () => void;
}

export const MessageInput = React.forwardRef<{ focus: () => void }, MessageInputProps>(({
  channelId,
  placeholder = "Type a message...",
  disabled,
  replyTo,
  onCancelReply,
}, ref) => {
  const { toast } = useToast();
  const [content, setContent] = React.useState("");
  const [type, setType] = React.useState<'text' | 'code'>('text');
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Expose focus method
  React.useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus()
  }));

  // Handle typing status
  React.useEffect(() => {
    if (content && !typingTimeoutRef.current) {
      updateTypingStatus(channelId, true);
      typingTimeoutRef.current = setTimeout(() => {
        updateTypingStatus(channelId, false);
        typingTimeoutRef.current = null;
      }, 3000);
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        updateTypingStatus(channelId, false);
      }
    };
  }, [content, channelId]);

  const handleSend = async () => {
    if (!content.trim() && !attachments.length) return;

    try {
      setIsUploading(true);
      const result = await sendMessage({
        channelId,
        content: content.trim(),
        type,
        replyToId: replyTo?.id,
        attachments
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Clear input
      setContent("");
      setType('text');
      setAttachments([]);
      if (onCancelReply) onCancelReply();

    } catch (error) {
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (file: File) => {
    setAttachments(prev => [...prev, file]);
  };

  return (
    <div className="relative">
      {replyTo && (
        <div className="absolute -top-12 left-0 right-0 bg-muted/50 p-2 rounded-t-md flex items-center gap-2">
          <Reply className="h-4 w-4" />
          <span className="text-sm flex-1 truncate">
            Replying to <b>{replyTo.author}</b>: {replyTo.content}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-56">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button variant="outline" className="w-full">
                  <Image className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </label>

              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </label>
            </div>
          </PopoverContent>
        </Popover>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="min-h-[20px] max-h-32 resize-none"
          rows={1}
        />

        <Button
          disabled={(!content.trim() && !attachments.length) || disabled || isUploading}
          onClick={handleSend}
          className="shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="bg-muted px-2 py-1 rounded-md text-sm flex items-center gap-2"
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => setAttachments(files => files.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

MessageInput.displayName = 'MessageInput';