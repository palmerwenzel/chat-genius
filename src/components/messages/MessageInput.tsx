import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Send, Image, FileText, Reply, X, Bot } from "lucide-react";
import { FileUpload } from "./FileUpload";
import { presenceService } from '@/services/presence';
import { Command, CommandList, CommandItem } from "@/components/ui/command";

interface MessageInputProps {
  onSend?: (content: string, type: 'text' | 'code', attachments?: File[], replyTo?: { id: string; content: string; author: string }) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    author: string;
  };
  onCancelReply?: () => void;
  onNavigateToMessage?: (messageId: string) => void;
  initialContent?: string;
  initialType?: 'text' | 'code';
  onCancel?: () => void;
  channelId?: string;
}

const BOT_COMMANDS = [
  {
    command: '@bot seed',
    description: 'Triggers conversation between two AI chatbots',
    usage: '@bot seed <prompt>'
  },
  {
    command: '@bot summary',
    description: 'Generates channel summary using RAG',
    usage: '@bot summary'
  }
];

export const MessageInput = React.forwardRef<{ focus: () => void }, MessageInputProps>(({ 
  onSend, 
  placeholder = "Type a message...", 
  disabled,
  replyTo,
  onCancelReply,
  onNavigateToMessage,
  initialContent = '',
  initialType = 'text',
  onCancel,
  channelId
}, ref) => {
  const [content, setContent] = React.useState(initialContent);
  const [isCode, setIsCode] = React.useState(initialType === 'code');
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [showCommands, setShowCommands] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update content when initialContent changes
  React.useEffect(() => {
    setContent(initialContent);
    setIsCode(initialType === 'code');
  }, [initialContent, initialType]);

  // Handle typing status
  React.useEffect(() => {
    if (!channelId) return;

    // Update typing status when content changes
    if (content.trim()) {
      presenceService.updateTypingStatus(channelId, true);
    } else {
      presenceService.updateTypingStatus(channelId, false);
    }

    // Clean up typing status when unmounting
    return () => {
      if (channelId) {
        presenceService.updateTypingStatus(channelId, false);
      }
    };
  }, [content, channelId]);

  // Expose focus method
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }), []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      const cursorPosition = textareaRef.current?.selectionStart || 0;
      const textBeforeCursor = content.substring(0, cursorPosition);
      
      // Only show commands if @ is typed at the start of a line or after a space
      if (cursorPosition === 0 || textBeforeCursor.endsWith(' ')) {
        setShowCommands(true);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showCommands) {
        setShowCommands(false);
      } else if (replyTo && onCancelReply) {
        onCancelReply();
      } else if (onCancel) {
        onCancel();
      } else {
        textareaRef.current?.blur();
      }
    }
  };

  const handleCommandSelect = (command: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    // Replace the @ with the full command
    const newContent = textBeforeCursor + command + ' ' + textAfterCursor;
    setContent(newContent);
    setShowCommands(false);
    
    // Focus back on textarea and move cursor after the command
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const newPosition = cursorPosition + command.length + 1;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    });
  };

  const handleSend = () => {
    if ((content.trim() || pendingFiles.length > 0) && onSend) {
      onSend(content, isCode ? 'code' : 'text', pendingFiles, replyTo);
      setContent("");
      setIsCode(false);
      setPendingFiles([]);
      if (onCancelReply) onCancelReply();
    }
  };

  const handleFileSelect = async (file: File) => {
    setPendingFiles(prev => [...prev, file]);
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileClick = () => {
    // Create a file input if it doesn't exist
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleFileSelect(file);
      };
      fileInputRef.current = input;
      document.body.appendChild(input);
    }
    fileInputRef.current.click();
  };

  React.useEffect(() => {
    // Cleanup file input on unmount
    return () => {
      if (fileInputRef.current) {
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {replyTo && (
        <div className="flex items-center gap-2 -mt-1.5 px-3 py-1.5 bg-muted/50 rounded text-sm">
          <Reply className="h-3 w-3 text-muted-foreground rotate-180" />
          <button 
            onClick={() => onNavigateToMessage?.(replyTo.id)}
            className="flex-1 text-left hover:underline"
          >
            <span className="text-muted-foreground">Replying to <span className="text-foreground">{replyTo.author}</span></span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((file, index) => (
            <FileUpload
              key={index}
              selectedFile={file}
              onFileSelect={() => {}}
              onCancel={() => handleRemoveFile(index)}
              className="mb-2"
            />
          ))}
        </div>
      )}

      <div className="relative">
        {showCommands && (
          <Command className="absolute bottom-full mb-1 w-64">
            <CommandList>
              {BOT_COMMANDS.map((cmd) => (
                <CommandItem
                  key={cmd.command}
                  onSelect={() => handleCommandSelect(cmd.command)}
                  className="flex items-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  <div>
                    <p>{cmd.command}</p>
                    <p className="text-xs text-muted-foreground">{cmd.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={
                "min-h-[80px] w-full resize-none bg-background " +
                (isCode ? "font-mono" : "")
              }
            />
          </div>

          {onCancel && (
            <Button 
              onClick={onCancel}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {!initialContent && (
            <div className="flex flex-col justify-evenly gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="start">
                  <div className="grid gap-1">
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={handleFileClick}
                      disabled={disabled}
                    >
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={handleFileClick}
                      disabled={disabled}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Upload File
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                onClick={handleSend}
                disabled={(!content.trim() && !pendingFiles.length) || disabled}
                size="icon"
                className="h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Format hint */}
      <div className="flex gap-4 ml-1 text-xs text-muted-foreground">
        <span>Press Enter to send</span>
        <span>Shift + Enter for new line</span>
        <span>Type @ for bot commands</span>
        {isCode && <span>Code formatting enabled</span>}
        {onCancel && <span>Esc to cancel</span>}
      </div>
    </div>
  );
});

MessageInput.displayName = "MessageInput"; 